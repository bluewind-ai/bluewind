import logging
import os
import asyncio
import boto3
import click
import json
from datetime import datetime

async def run_deploy():
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
    
    with open("tofu_output.json", 'r') as f:
        output_data = json.load(f)
    
    cluster_arn = output_data['ecs_cluster_arn']['value']
    service_name = output_data['ecs_service_name']['value']
    task_definition_full = output_data['task_definition_name_and_revision']['value']
    task_definition_parts = task_definition_full.split(':')
    task_definition = f"{task_definition_parts[0]}:{task_definition_parts[-1]}"

    ecs_client = boto3.client('ecs',
        aws_access_key_id=env['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=env['AWS_SECRET_ACCESS_KEY'],
        region_name='us-west-2'
    )

    service_description = ecs_client.describe_services(
        cluster=cluster_arn,
        services=[service_name]
    )

    task_sets = service_description['services'][0].get('taskSets', [])
    if len(task_sets) > 1:
        for task_set in task_sets:
            task_set_arn = task_set['taskSetArn']
            ecs_client.delete_task_set(
                cluster=cluster_arn,
                service=service_name,
                taskSet=task_set_arn
            )
        print(f"Error: Found {len(task_sets)} task sets after OpenTofu operations. Expected 1 or fewer.")
        return
    response = ecs_client.create_task_set(
        cluster=cluster_arn,
        service=service_name,
        taskDefinition=task_definition,
        launchType='EC2',
        scale={'value': 100, 'unit': 'PERCENT'}
    )
    new_task_set_id = response['taskSet']['id']

    if len(task_sets) == 0:
        return 
        
    max_attempts = 60  # Adjust this value as needed
    delay = 1  # Delay in seconds between each check

    for _ in range(1, max_attempts + 1):
        response = ecs_client.describe_task_sets(
            cluster=cluster_arn,
            service=service_name,
            taskSets=[
                new_task_set_id
            ],
        )
        class DateTimeEncoder(json.JSONEncoder):
            def default(self, obj):
                if isinstance(obj, datetime):
                    return obj.isoformat()
                return super(DateTimeEncoder, self).default(obj)
        print(json.dumps(response, cls=DateTimeEncoder))
        if response['taskSets'][0]['stabilityStatus'] == "STEADY_STATE":
            ecs_client.delete_task_set(
                cluster=cluster_arn,
                service=service_name,
                taskSet=task_sets[0]["taskSetArn"]
            )
            return True
        await asyncio.sleep(delay)

    return False