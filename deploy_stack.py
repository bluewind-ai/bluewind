import json
import os
import asyncio
import boto3
import click

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

    # Run combined command
    process = await asyncio.create_subprocess_shell(
        combined_command,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.STDOUT,
        env=env
    )
    
    while True:
        line = await process.stdout.readline()
        if not line:
            break
        print(line.decode().strip())

    await process.wait()
    
    with open("tofu_output.json", 'r') as f:
        output_data = json.load(f)
    
    print("OpenTofu Output:")
    print(json.dumps(output_data, indent=2))
    
    cluster_arn = output_data['ecs_cluster_arn']['value']
    service_name = output_data['ecs_service_name']['value']
    task_set_a_id = output_data['task_set_a_id']['value'].split(',')[0]
    task_set_b_id = output_data['task_set_b_id']['value'].split(',')[0]
    task_set_a_scale = output_data['task_set_a_scale']['value']
    task_set_b_scale = output_data['task_set_b_scale']['value']
    task_definition = output_data['task_definition_name_and_revision']['value']

    
    ecs_client = boto3.client('ecs',
        aws_access_key_id=env['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=env['AWS_SECRET_ACCESS_KEY'],
        region_name='us-west-2'
    )

    if task_set_a_scale == 100 and task_set_b_scale == 100:
        pass
    elif task_set_a_scale == 0 and task_set_b_scale == 0:
        old_task_set, new_task_set = task_set_b_id, task_set_a_id
    elif task_set_a_scale == 100:
        old_task_set, new_task_set = task_set_a_id, task_set_b_id
    elif task_set_b_scale == 100:
        old_task_set, new_task_set = task_set_b_id, task_set_a_id

    ecs_client.update_task_set(
        cluster=cluster_arn,
        service=service_name,
        taskSet=new_task_set,
        # taskDefinition=task_definition,
        scale={'value': 100, 'unit': 'PERCENT'}
    )

    # ecs_client.update_task_set(
    #     cluster=cluster_arn,
    #     service=service_name,
    #     taskSet=task_set_b_id,
    #     # taskDefinition=task_definition,
    #     scale={'value': 100, 'unit': 'PERCENT'}
    # )

    for _ in range(30):
        response = ecs_client.describe_services(cluster=cluster_arn, services=[service_name])
        service = response['services'][0]
        task_sets = service.get('taskSets', [])

        if all(ts.get('scale', {}).get('value') == 100 and ts.get('status') == 'ACTIVE' for ts in task_sets):
            return True

        await asyncio.sleep(10)

    return False