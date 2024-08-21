import json
import os
import asyncio
import boto3
import click
from datetime import datetime

async def run_deploy(log_dir, display_output=False):
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
    
    commands = [
        "cd opentf_deploy",
        "tofu init",
        f"tofu apply -lock=false --auto-approve",
        f"tofu output -json > ../{log_dir}/tofu_output.json"
    ]
    
    process = await asyncio.create_subprocess_shell(
        " && ".join(commands),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.STDOUT,
        env=env
    )
    
    with open(f"{log_dir}/tofu_full.log", 'w') as f:
        async for line in process.stdout:
            line = line.decode()
            if display_output:
                click.echo(line, nl=False)
            f.write(line)
    
    await process.wait()
    
    with open(f"{log_dir}/tofu_output.json", 'r') as f:
        output_data = json.load(f)
    
    cluster_arn = output_data['ecs_cluster_arn']['value']
    service_name = output_data['ecs_service_name']['value']
    task_set_a_id = output_data['task_set_a_id']['value'].split(',')[0]
    task_set_b_id = output_data['task_set_b_id']['value'].split(',')[0]
    task_set_a_scale = output_data['task_set_a_scale']['value']
    task_set_b_scale = output_data['task_set_b_scale']['value']
    
    ecs_client = boto3.client('ecs',
        aws_access_key_id=env['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=env['AWS_SECRET_ACCESS_KEY'],
        region_name='us-west-2'
    )

    # Determine which task set to update
    if task_set_a_scale == 100 and task_set_b_scale == 100:
        click.echo("Both task sets are already at 100% scale. No changes needed.")
        return True
    elif task_set_a_scale == 0 and task_set_b_scale == 0:
        old_task_set, new_task_set = task_set_b_id, task_set_a_id
    elif task_set_a_scale == 100:
        old_task_set, new_task_set = task_set_a_id, task_set_b_id
    elif task_set_b_scale == 100:
        old_task_set, new_task_set = task_set_b_id, task_set_a_id
        

    click.echo(f"Scaling up new task set {new_task_set} to 100%...")
    ecs_client.update_task_set(
        cluster=cluster_arn,
        service=service_name,
        taskSet=new_task_set,
        scale={'value': 100, 'unit': 'PERCENT'}
    )

    ecs_client.update_task_set(
        cluster=cluster_arn,
        service=service_name,
        taskSet=old_task_set,
        scale={'value': 100, 'unit': 'PERCENT'}
    )

    click.echo("Waiting for service to stabilize...")
    for attempt in range(30):
        response = ecs_client.describe_services(cluster=cluster_arn, services=[service_name])
        service = response['services'][0]
        running_count = service.get('runningCount', 0)
        desired_count = service.get('desiredCount', 0)
        task_sets = service.get('taskSets', [])

        click.echo(f"Attempt {attempt + 1}: Running {running_count}/{desired_count} tasks")
        click.echo(f"Task Sets: {len(task_sets)}")

        for task_set in task_sets:
            click.echo(f"  Task Set {task_set.get('id')}: {task_set.get('status', 'Unknown')}: {task_set.get('runningCount', 0)}/{task_set.get('computedDesiredCount', 0)} tasks")

        # Check if both task sets are at 100% and stable
        if all(ts.get('scale', {}).get('value') == 100 and ts.get('status') == 'ACTIVE' for ts in task_sets):
            click.echo("Both task sets are now at 100% and stable.")
            return True

        click.echo(f"Service state: {service.get('status', 'Unknown')}")
        click.echo("Events:")
        for event in service.get('events', [])[:5]:
            click.echo(f"  {event.get('createdAt', 'Unknown time')}: {event.get('message', 'No message')}")

        await asyncio.sleep(10)

    click.echo("Service failed to stabilize within the expected time.")
    return False