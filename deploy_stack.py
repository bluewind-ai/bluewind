from asyncio import subprocess
import base64
import logging
import os
import asyncio
import boto3
import click
import json
from datetime import datetime

async def build_and_push_image(env):
    # Get the ECR repository URL and region
    with open("tofu_output.json", 'r') as f:
        output_data = json.load(f)
    ecr_repo_url = output_data['ecr_repository_url']['value']
    region = "us-west-2"

    commands = [
        f"echo 'Building Docker image...'",
        f"docker build -t app-bluewind:latest .",
        f"IMAGE_ID=$(docker images -q app-bluewind:latest)",
        f"echo 'Image built with ID: '$IMAGE_ID",
        f"echo 'Tagging image...'",
        f"docker tag $IMAGE_ID {ecr_repo_url}:$IMAGE_ID",
        f"echo 'Logging into ECR...'",
        f"aws ecr get-login-password --region {region} | docker login --username AWS --password-stdin {ecr_repo_url}",
        f"echo 'Pushing image to ECR...'",
        f"docker push {ecr_repo_url}:$IMAGE_ID",
        f"echo 'Image pushed successfully with tag: '$IMAGE_ID",
        f"echo $IMAGE_ID > opentf_deploy/image_tag.txt"
    ]

    combined_command = " && ".join(commands)
    
    process = await asyncio.create_subprocess_shell(
        combined_command,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        env=env
    )

    async def stream_output(stream):
        while True:
            line = await stream.readline()
            if not line:
                break
            print(line.decode().strip())

    # Stream both stdout and stderr
    await asyncio.gather(
        stream_output(process.stdout),
        stream_output(process.stderr)
    )

    await process.wait()

    if process.returncode != 0:
        print(f"Error: Docker command failed with exit code {process.returncode}")
        return False

    return True

async def run_deploy():
    print("Starting deployment process")
    
    env = os.environ.copy()
    if os.path.exists('.aws'):
        with open('.aws', 'r') as f:
            for line in f:
                if '=' in line:
                    key, value = line.strip().split('=', 1)
                    env[key] = value
    env.update({
        "TF_VAR_aws_access_key_id": env.get("AWS_ACCESS_KEY_ID", ""),
        "TF_VAR_aws_secret_access_key": env.get("AWS_SECRET_ACCESS_KEY", ""),
        "TF_VAR_app_name": "bluewind-app"
    })
    
    print("Running OpenTofu commands")
    combined_command = (
        "cd opentf_deploy && "
        "tofu init && "
        "tofu apply -lock=false --auto-approve && "
        "tofu output -json > ../tofu_output.json"
    )

    process = await asyncio.create_subprocess_shell(
        combined_command,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        env=env
    )
    
    async def read_stream(stream):
        while True:
            line = await stream.readline()
            if not line:
                break
            print(line.decode().strip())

    await asyncio.gather(
        read_stream(process.stdout),
        read_stream(process.stderr)
    )

    await process.wait()
    
    if process.returncode != 0:
        print(f"Error: Tofu command failed with exit code {process.returncode}")
        return

    print("OpenTofu commands completed successfully")
    
    print("Building and pushing Docker image")
    if not await build_and_push_image(env):
        print("Failed to build and push Docker image")
        return
    
    print("Docker image built and pushed successfully")
    
    print("Reading OpenTofu output")
    with open("tofu_output.json", 'r') as f:
        output_data = json.load(f)
    
    cluster_arn = output_data['ecs_cluster_arn']['value']
    service_name = output_data['ecs_service_name']['value']
    task_definition_full = output_data['task_definition_name_and_revision']['value']
    task_definition_parts = task_definition_full.split(':')
    task_definition = f"{task_definition_parts[0]}:{task_definition_parts[-1]}"

    print(f"Cluster ARN: {cluster_arn}")
    print(f"Service Name: {service_name}")
    print(f"Task Definition: {task_definition}")

    print("Initializing ECS client")
    ecs_client = boto3.client('ecs',
        aws_access_key_id=env['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=env['AWS_SECRET_ACCESS_KEY'],
        region_name='us-west-2'
    )

    print("Describing ECS service")
    service_description = ecs_client.describe_services(
        cluster=cluster_arn,
        services=[service_name]
    )

    task_sets = service_description['services'][0].get('taskSets', [])
    # iterate through task_sets and put in a list all the things not in DRAINING status
    active_task_sets = [task_set for task_set in task_sets if task_set['status'] != 'DRAINING']

    print(json.dumps(active_task_sets, indent=4, sort_keys=True, default=str))
    print(f"Found {len(active_task_sets)} existing task sets")

    if len(active_task_sets) > 1:
        print(f"Found {len(active_task_sets)} task sets. Deleting excess task sets.")
        for task_set in active_task_sets:
            task_set_arn = task_set['taskSetArn']
            ecs_client.delete_task_set(
                cluster=cluster_arn,
                service=service_name,
                taskSet=task_set_arn,
                force=True
            )
        print(f"Error: Found {len(active_task_sets)} task sets after OpenTofu operations. Expected 1 or fewer.")
        return

    print("Creating new task set")
    response = ecs_client.create_task_set(
        cluster=cluster_arn,
        service=service_name,
        taskDefinition=task_definition,
        launchType='EC2',
        scale={'value': 100, 'unit': 'PERCENT'}
    )
    new_task_set_id = response['taskSet']['id']
    print(f"New task set created with ID: {new_task_set_id}")

    if len(active_task_sets) == 0:
        print("No task was running in this environment previously")
        
    print("Waiting for new task set to reach steady state")
    max_attempts = 25
    delay = 1

    for attempt in range(1, max_attempts + 1):
        response = ecs_client.describe_task_sets(
            cluster=cluster_arn,
            service=service_name,
            taskSets=[new_task_set_id],
        )
        print(f"Attempt {attempt}: Task set status: {response['taskSets'][0]['stabilityStatus']}")
        if response['taskSets'][0]['stabilityStatus'] == "STEADY_STATE":
            print("New task set reached steady state")
            print("Deleting old task set")
            if len(active_task_sets) == 1:
                ecs_client.delete_task_set(
                    cluster=cluster_arn,
                    service=service_name,
                    taskSet=active_task_sets[0]["taskSetArn"]
                )
            print("Deployment completed successfully")
            return True
        await asyncio.sleep(delay)
    ecs_client.delete_task_set(
        cluster=cluster_arn,
        service=service_name,
        taskSet=new_task_set_id,
    )
    print("Deployment failed: New task set did not reach steady state within the timeout period")
    return False