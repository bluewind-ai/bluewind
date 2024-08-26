import os
import asyncio
import time
import boto3
import json
from botocore.exceptions import ClientError
import json
from ci_utils import run_command

def get_secret_keys_and_values():
    session = boto3.session.Session()
    client = session.client(service_name='secretsmanager', region_name='us-west-2')
    get_secret_value_response = client.get_secret_value(
        SecretId="arn:aws:secretsmanager:us-west-2:361769569102:secret:prod-env-NnKDbx"
    )
    secret = json.loads(get_secret_value_response['SecretString'])
    return secret.items()

async def build_and_push_docker_image(output_data, log_file, env, verbose=True):
    with open('last_deployment.json', 'r') as file:
        last_deployment = json.load(file)
    
    previous_image_id = last_deployment['image_id']

    build_commands = [
        f"set -e",
        f"docker build -t app-bluewind:latest .",
        f"IMAGE_ID=$(docker images -q app-bluewind:latest)",
        f"echo $IMAGE_ID > image_id.txt"
    ]

    await run_command(" && ".join(build_commands), log_file, env=env, verbose=verbose)

    with open('image_id.txt', 'r') as file:
        new_image_id = file.read().strip()

    assert new_image_id, "Error: No image ID found"

    if new_image_id != previous_image_id: 
        push_commands = [
            f"set -e",
            f"docker tag {new_image_id} {output_data['ecr_repository_url']['value']}:{new_image_id}",
            f"aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin {output_data['ecr_repository_url']['value']}",
            f"docker push {output_data['ecr_repository_url']['value']}:{new_image_id}"
        ]
        for command in push_commands:
            await run_command(command, log_file, env=env, verbose=verbose)
        
        # keep this for later
        last_deployment = {
            'image_id': new_image_id
        }

        with open('last_deployment.json', 'w') as file:
            json.dump(last_deployment, file, indent=2)

        return new_image_id
    
    return previous_image_id

    
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
        "TF_VAR_aws_access_key_id": env["AWS_ACCESS_KEY_ID"],
        "TF_VAR_aws_secret_access_key": env["AWS_SECRET_ACCESS_KEY"],
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
    
    image_id = await build_and_push_docker_image(output_data, log_file, env, verbose)

    elbv2_client = boto3.client('elbv2',
        aws_access_key_id=env['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=env['AWS_SECRET_ACCESS_KEY'],
        region_name='us-west-2'
    )
    service_name = output_data['ecs_service_name']['value']
    
    print("Reading OpenTofu output")
    
    cluster_arn = output_data['ecs_cluster_arn']['value']
    service_name = output_data['ecs_service_name']['value']
    ecs_task_execution_role_arn = output_data['ecs_task_execution_role_arn']['value']
    cloudwatch_log_group_name = output_data['cloudwatch_log_group_name']['value']

    new_target_group_response = elbv2_client.create_target_group(
        Name=f'tg-{service_name}-{int(time.time())}',
        Protocol='HTTP',
        Port=8000,
        VpcId=output_data['vpc_id']['value'],
        TargetType='instance',
        HealthCheckProtocol='HTTP',
        HealthCheckPath='/',
        HealthCheckEnabled=True,
        HealthCheckIntervalSeconds=5,
        HealthCheckTimeoutSeconds=2,
        HealthyThresholdCount=2,
        UnhealthyThresholdCount=2,
        Matcher={
            'HttpCode': '200-299'
        }
    )
    
    new_target_group_arn = new_target_group_response['TargetGroups'][0]['TargetGroupArn']

    print(f"Cluster ARN: {cluster_arn}")
    print(f"Service Name: {service_name}")

    print("Initializing ECS client")
    ecs_client = boto3.client('ecs',
        aws_access_key_id=env['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=env['AWS_SECRET_ACCESS_KEY'],
        region_name='us-west-2'
    )

    print("Creating new task definition")
    # with open("opentf_deploy/image_tag.txt", 'r') as f:
    #     image_id = f.read().strip()

    client = boto3.client('secretsmanager',
        aws_access_key_id=env["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=env["AWS_SECRET_ACCESS_KEY"],
        region_name="us-west-2"
    )
    
    get_secret_value_response = client.get_secret_value(
        SecretId="arn:aws:secretsmanager:us-west-2:361769569102:secret:prod-env-NnKDbx"
    )
    secrets = json.loads(get_secret_value_response['SecretString'])
    secrets = [
        {
            'name': key,
            'valueFrom': f"arn:aws:secretsmanager:us-west-2:361769569102:secret:prod-env-NnKDbx:{key}::"
        } for key, _ in secrets.items()
    ]

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
            'secrets': secrets,
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
                    'targetGroupArn': new_target_group_arn,  # Use the new target group
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
    max_attempts = 120
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
            
            existing_listeners = elbv2_client.describe_listeners(
                LoadBalancerArn=output_data['alb_arn']['value']
            )

            green_listener = next((listener for listener in existing_listeners['Listeners'] if listener['Port'] == 8080), None)
            if green_listener:
                green_listener_arn = green_listener['ListenerArn'] 
            
                response = elbv2_client.modify_listener( 
                    ListenerArn=green_listener_arn,
                    DefaultActions=[
                        {
                            'Type': 'forward',
                            'TargetGroupArn': new_target_group_arn
                        }
                    ]
                )
            else:
                elbv2_client.create_listener(
                    LoadBalancerArn=output_data['alb_arn']['value'],
                    Protocol='HTTP',
                    Port=8080,
                    DefaultActions=[{'Type': 'forward', 'TargetGroupArn': new_target_group_arn}]
                )
                
            from ci import run_e2e_prod_green

            if not await run_e2e_prod_green('logs/test.log', verbose=True):
                raise("E2E prod green failed")

            blue_listener = next((listener for listener in existing_listeners['Listeners'] if listener['Port'] == 80), None)
            if blue_listener:
                blue_listener_arn = blue_listener['ListenerArn'] 
            
                response = elbv2_client.modify_listener( 
                    ListenerArn=blue_listener_arn,
                    DefaultActions=[
                        {
                            'Type': 'forward',
                            'TargetGroupArn': new_target_group_arn
                        }
                    ]
                )
            else:
                elbv2_client.create_listener(
                    LoadBalancerArn=output_data['alb_arn']['value'],
                    Protocol='HTTP',
                    Port=80,
                    DefaultActions=[{'Type': 'forward', 'TargetGroupArn': new_target_group_arn}]
                )
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