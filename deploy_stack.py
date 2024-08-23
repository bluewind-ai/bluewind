import os
import asyncio
import boto3
import json
from botocore.exceptions import ClientError
import json
import toml
from packaging import version

from ci_utils import run_command

from packaging import version

async def build_and_push_docker_image(output_data, log_file, env, verbose=True):
    print("Starting build_and_push_docker_image function")
    
    with open('last_deployment.json', 'r') as file:
        last_deployment = json.load(file)
    
    previous_version = last_deployment['previous_version']
    current_version = last_deployment['current_version']
    previous_image_id = last_deployment['image_id']
    
    print(f"Previous version: {previous_version}")
    print(f"Current version: {current_version}")
    print(f"Previous image ID: {previous_image_id}")

    pyproject_path = 'pyproject.toml'
    pyproject_data = toml.load(pyproject_path)
    pyproject_data['tool']['poetry']['version'] = previous_version
    
    print(f"Updating pyproject.toml with version: {previous_version}")
    with open(pyproject_path, 'w') as file:
        toml.dump(pyproject_data, file)

    # Block 1: Build Docker image
    build_commands = [
        f"docker build -t app-bluewind:latest .",
        f"IMAGE_ID=$(docker images -q app-bluewind:latest)",
        f"echo $IMAGE_ID > image_id.txt"
    ]

    print("Starting Docker build process")
    await run_command(" && ".join(build_commands), log_file, env=env, verbose=verbose)
    print("Docker build completed")

    try:
        with open('image_id.txt', 'r') as file:
            new_image_id = file.read().strip()
        os.remove('image_id.txt')
    except FileNotFoundError:
        print("Error: image_id.txt not found. Docker build may have failed.")
        return None, None
    except IOError:
        print("Error: Unable to read image_id.txt")
        return None, None

    print(f"Raw new_image_id: {new_image_id}")

    if not new_image_id:
        print("Error: new_image_id is empty. Docker build may have failed.")
        return None, None

    print(f"Comparing image IDs: new {new_image_id} vs previous {previous_image_id}")
    if new_image_id != previous_image_id:
        # Increment the version
        v = version.parse(current_version)
        new_version = f"{v.major}.{v.minor}.{v.micro + 1}"
        print(f"Image changed. Incrementing version from {current_version} to {new_version}")
        push_commands = [
            f"docker tag $IMAGE_ID {output_data['ecr_repository_url']['value']}:$IMAGE_ID",
            f"aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin {output_data['ecr_repository_url']['value']}",
            f"docker push {output_data['ecr_repository_url']['value']}:$IMAGE_ID"
        ]
        await run_command(" && ".join(push_commands), log_file, env=env, verbose=verbose)
    else:
        new_version = current_version
        print(f"Image unchanged. Keeping version at {current_version}")

    print(f"Updating pyproject.toml with new version: {new_version}")
    pyproject_data['tool']['poetry']['version'] = new_version
    with open(pyproject_path, 'w') as file:
        toml.dump(pyproject_data, file)

    # Block 2: Push Docker image
    
    print("Starting Docker push process")
    print("Docker push completed")

    last_deployment = {
        'current_version': new_version,
        'previous_version': current_version,
        'image_id': new_image_id
    }
    print("Updating last_deployment.json with new information")
    with open('last_deployment.json', 'w') as file:
        json.dump(last_deployment, file, indent=2)

    print("build_and_push_docker_image function completed")
    return current_version, new_image_id
    
async def run_deploy(log_file, verbose=True):
    print('running logs in', log_file)
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

    await run_command(combined_command, log_file, env=env, verbose=verbose)

    print("OpenTofu commands completed successfully")
    with open("tofu_output.json", 'r') as f:
        output_data = json.load(f)
    
    await build_and_push_docker_image(output_data, log_file, env, verbose)

    
    print("Reading OpenTofu output")
    
    cluster_arn = output_data['ecs_cluster_arn']['value']
    service_name = output_data['ecs_service_name']['value']
    target_group_arn = output_data['alb_target_group_arn']['value']
    ecs_task_execution_role_arn = output_data['ecs_task_execution_role_arn']['value']
    cloudwatch_log_group_name = output_data['cloudwatch_log_group_name']['value']

    print(f"Cluster ARN: {cluster_arn}")
    print(f"Service Name: {service_name}")

    print("Initializing ECS client")
    ecs_client = boto3.client('ecs',
        aws_access_key_id=env['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=env['AWS_SECRET_ACCESS_KEY'],
        region_name='us-west-2'
    )

    print("Creating new task definition")
    with open("opentf_deploy/image_tag.txt", 'r') as f:
        image_id = f.read().strip()
    
    task_definition_response = ecs_client.register_task_definition(
        family='app-task',
        taskRoleArn=ecs_task_execution_role_arn,
        executionRoleArn=ecs_task_execution_role_arn,
        networkMode='bridge',
        requiresCompatibilities=['EC2'],
        containerDefinitions=[{
            'name': 'app-container',
            'image': f"{output_data['ecr_repository_url']['value']}:{image_id}",
            'memory': 1024,
            'cpu': 1024,
            'portMappings': [{'containerPort': 8000, 'hostPort': 0}],  # Use dynamic host port mapping
            'logConfiguration': {
                'logDriver': 'awslogs',
                'options': {
                    'awslogs-group': cloudwatch_log_group_name,
                    'awslogs-region': 'us-west-2',
                    'awslogs-stream-prefix': 'ecs'
                }
            },
            'environment': [
                {'name': 'ECS_ENABLE_CONTAINER_METADATA', 'value': 'true'},
                {'name': 'DEBUG', 'value': '1'},
                {'name': 'SECRET_KEY', 'value': 'your_secret_key_here'},
                {'name': 'ALLOWED_HOSTS', 'value': 'localhost,127.0.0.1,*'},
                {'name': 'DATABASE_ENGINE', 'value': 'django.db.backends.postgresql'},
                {'name': 'DB_USERNAME', 'value': 'dbadmin'},
                {'name': 'DB_PASSWORD', 'value': 'changeme123'},
                {'name': 'DB_HOST', 'value': 'app-bluewind-db.c50acykqkhaw.us-west-2.rds.amazonaws.com'},
                {'name': 'DB_PORT', 'value': '5432'},
                {'name': 'DB_NAME', 'value': 'postgres'},
                {'name': 'DJANGO_SUPERUSER_EMAIL', 'value': 'admin@example.com'},
                {'name': 'DJANGO_SUPERUSER_USERNAME', 'value': 'admin@example.com'},
                {'name': 'DJANGO_SUPERUSER_PASSWORD', 'value': 'admin123'},
                {'name': 'ENVIRONMENT', 'value': 'staging'},
                {'name': 'CSRF_TRUSTED_ORIGINS', 'value': '*,'},
                {'name': 'AWS_DEFAULT_REGION', 'value': 'us-west-2'}
            ],
            # "healthCheck": {
            #     "command": ["CMD-SHELL", "curl -v -f http://locdscalhost/ || exit 1"],
            #     "interval": 5,
            #     "timeout": 5,
            #     "retries": 3,
            #     "startPeriod": 10
            # }
        }]
    )
    task_definition = f"{task_definition_response['taskDefinition']['family']}:{task_definition_response['taskDefinition']['revision']}"
    print(f"New task definition created: {task_definition}")

    print("Describing ECS service")
    service_description = ecs_client.describe_services(
        cluster=cluster_arn,
        services=[service_name]
    )

    task_sets = service_description['services'][0].get('taskSets', [])
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
    try:
        response = ecs_client.create_task_set(
            cluster=cluster_arn,
            service=service_name,
            taskDefinition=task_definition,
            launchType='EC2',
            scale={'value': 100, 'unit': 'PERCENT'},
            loadBalancers=[
                {
                    'targetGroupArn': target_group_arn,
                    'containerName': 'app-container',
                    'containerPort': 8000
                }
            ]
        )
        new_task_set_id = response['taskSet']['id']
        print(f"New task set created with ID: {new_task_set_id}")
    except ClientError as e:
        print(f"Error creating task set: {e}")
        return False

    if len(active_task_sets) == 0:
        print("No task was running in this environment previously")
        
    print("Waiting for new task set to reach steady state")
    max_attempts = 60
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
        force=True
    )
    print("Deployment failed: New task set did not reach steady state within the timeout period")
    return False