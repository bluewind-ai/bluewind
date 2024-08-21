import json
import os
import asyncio
from datetime import datetime
import time
from datetime import timedelta
import click
from botocore.exceptions import WaiterError, ClientError
import boto3
import botocore

def create_log_directory():
    readable_timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    reverse_timestamp = str(9999999999 - int(time.time())).zfill(10)
    log_dir = f"./logs/{reverse_timestamp}_{readable_timestamp}"
    os.makedirs(log_dir, exist_ok=True)
    return log_dir

async def run_command(command, log_file, env=None):
    with open(log_file, 'w') as f:
        process = await asyncio.create_subprocess_shell(
            command,
            stdout=f,
            stderr=asyncio.subprocess.STDOUT,
            env=env
        )
        return process

async def wait_for_process(process, timeout=1800):
    try:
        await asyncio.wait_for(process.wait(), timeout=timeout)
        return process.returncode == 0
    except asyncio.TimeoutError:
        process.terminate()
        await process.wait()
        return False

async def run_local_server(log_dir):
    click.echo("Starting local server...")
    server_log = f"{log_dir}/local_server.log"
    process = await run_command(f"gunicorn --bind :8002 --workers 1 bluewind.wsgi", server_log)
    with open(f"{log_dir}/server.pid", 'w') as f:
        f.write(str(process.pid))
    return process

async def run_local_tests(log_dir):
    click.echo("Running tests locally...")
    env = os.environ.copy()
    env.update({
        "ENVIRONMENT": "test",
        "TEST_HOST": "localhost",
        "ALLOWED_HOSTS": "localhost,",
        "TEST_PORT": "8002"
    })
    return await run_command("python3 manage.py test", f"{log_dir}/local_tests.log", env=env)

async def run_tests_against_staging(log_dir):
    click.echo("Running tests against staging...")
    env = os.environ.copy()
    env.update({
        "ENVIRONMENT": "test",
        "TEST_HOST": "app-bluewind-alb-1840324227.us-west-2.elb.amazonaws.com",
        "ALLOWED_HOSTS": "app-bluewind-alb-1840324227.us-west-2.elb.amazonaws.com,"
    })
    return await run_command("python3 manage.py test", f"{log_dir}/staging_tests.log", env=env)

async def run_docker_tests(log_dir):
    click.echo("Building Docker image and running tests...")
    commands = [
        "docker build -t my-django-app .",
        "docker run -e ENVIRONMENT=test -e DEBUG=1 -e SECRET_KEY=your_secret_key_here "
        "-e ALLOWED_HOSTS=localhost,127.0.0.1 -e CSRF_TRUSTED_ORIGINS=http://localhost,http://127.0.0.1 "
        "my-django-app python3 manage.py test"
    ]
    return await run_command(" && ".join(commands), f"{log_dir}/docker_tests.log")

async def run_process(command, env, log_file, display_output=False):
    process = await asyncio.create_subprocess_shell(
        command,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.STDOUT,
        env=env
    )
    
    with open(log_file, 'w') as f:
        async for line in process.stdout:
            line = line.decode()
            if display_output:
                click.echo(line, nl=False)
            f.write(line)
    
    await process.wait()
    return process


async def check_service_stability(ecs_client, cluster_arn, service_name, max_attempts=40, delay=15):
    for _ in range(max_attempts):
        response = ecs_client.describe_services(cluster=cluster_arn, services=[service_name])
        service = response['services'][0]
        
        if service['runningCount'] == service['desiredCount']:
            # Check if all task sets are stable
            all_task_sets_stable = all(
                task_set['stabilityStatus'] == 'STEADY_STATE'
                for task_set in service['taskSets']
            )
            if all_task_sets_stable:
                return True
        
        await asyncio.sleep(delay)
    
    return False

async def describe_service_status(ecs_client, cluster_arn, service_name):
    response = ecs_client.describe_services(
        cluster=cluster_arn,
        services=[service_name]
    )

    task_sets = response['services'][0]['taskSets']
    for task_set in task_sets:
        task_set_id = task_set['id']
        task_set_percentage = task_set['scale']['value']
        click.echo(f"Task set {task_set_id} percentage: {task_set_percentage}%")

async def run_deploy(log_dir, display_output=False):
    click.echo(f"Running OpenTofu commands...")
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
    
    command = " && ".join(commands)
    process = await run_process(command, env, f"{log_dir}/tofu_full.log", display_output)
    await process.wait()
    with open(f"{log_dir}/tofu_output.json", 'r') as f:
        output_data = json.load(f)
    
    cluster_arn = output_data['ecs_cluster_arn']['value']
    service_name = output_data['ecs_service_name']['value']
    task_set_a_id = output_data['task_set_a_id']['value']
    task_set_b_id = output_data['task_set_b_id']['value']
    task_set_a_scale = output_data['task_set_a_scale']['value']
    task_set_b_scale = output_data['task_set_b_scale']['value']
    
    ecs_client = boto3.client('ecs',
        aws_access_key_id=env['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=env['AWS_SECRET_ACCESS_KEY'],
        region_name='us-west-2'
    )

    # Determine which task set to update
    if task_set_a_scale == 100:
        old_task_set = task_set_a_id.split(',')[0]
        new_task_set = task_set_b_id.split(',')[0]
    elif task_set_b_scale == 100:
        old_task_set = task_set_b_id.split(',')[0]
        new_task_set = task_set_a_id.split(',')[0]
    else:
        click.echo("Error: No task set is at 100% scale")
        return False

    # Scale up the new task set
    click.echo(f"Scaling up new task set {new_task_set} to 100%...")
    response = ecs_client.update_task_set(
        cluster=cluster_arn,
        service=service_name,
        taskSet=new_task_set,
        scale={'value': 100, 'unit': 'PERCENT'}
    )
    click.echo(f"Update new task set response: {response}")

    # Wait for service to stabilize
    click.echo("Waiting for service to stabilize...")
    try:
        is_stable = await check_service_stability(ecs_client, cluster_arn, service_name)
        if not is_stable:
            click.echo("Service failed to stabilize within the expected time.")
            return False
        await describe_service_status(ecs_client, cluster_arn, service_name)
    except Exception as e:
        click.echo(f"Unexpected error during deployment: {str(e)}")
        return False

    # Scale down the old task set
    response = ecs_client.update_task_set(
        cluster=cluster_arn,
        service=service_name,
        taskSet=old_task_set,
        scale={'value': 0, 'unit': 'PERCENT'}
    )
    click.echo(f"Update old task set response: {response}")

    # Wait for service to stabilize again
    click.echo("Waiting for service to stabilize after scaling down old task set...")
    try:
        is_stable = await check_service_stability(ecs_client, cluster_arn, service_name)
        if not is_stable:
            click.echo("Service failed to stabilize after scaling down old task set.")
            return False
        await describe_service_status(ecs_client, cluster_arn, service_name)
    except Exception as e:
        click.echo(f"Unexpected error during deployment: {str(e)}")
        return False

    # Verify final task set percentages
    click.echo("Checking final task set percentages...")
    await describe_service_status(ecs_client, cluster_arn, service_name)

    response = ecs_client.describe_services(
        cluster=cluster_arn,
        services=[service_name]
    )

    task_sets = response['services'][0]['taskSets']
    for task_set in task_sets:
        if task_set['id'] in task_set_a_id:
            task_set_a_percentage = task_set['scale']['value']
        elif task_set['id'] in task_set_b_id:
            task_set_b_percentage = task_set['scale']['value']

    if (task_set_a_percentage == 100 and task_set_b_percentage == 0) or \
       (task_set_a_percentage == 0 and task_set_b_percentage == 100):
        click.echo(click.style("Deployment verified successfully.", fg='green'))
        return True
    else:
        click.echo(click.style(f"Warning: Unexpected task set percentages. A: {task_set_a_percentage}%, B: {task_set_b_percentage}%", fg='yellow'))
        return False


@click.group()
def cli():
    pass

@click.command()
@click.argument('command', default='full')
def cli(command):
    log_dir = create_log_directory()

    if command == 'deploy':
        asyncio.run(run_deploy(log_dir, display_output=True))
    elif command == 'full':
        asyncio.run(run_full(log_dir))
    else:
        click.echo(f"Unknown command: {command}")
        click.echo("Available commands: deploy, full")


async def run_full(log_dir):
    click.echo(f"Log directory: {log_dir}")

    processes = {
        "Local Server": (run_local_server, f"{log_dir}/local_server.log"),
        "Local Tests": (run_local_tests, f"{log_dir}/local_tests.log"),
        "Staging Tests": (run_tests_against_staging, f"{log_dir}/staging_tests.log"),
        "Docker Tests": (run_docker_tests, f"{log_dir}/docker_tests.log"),
        "OpenTofu": (lambda ld: run_full(ld, display_output=True), f"{log_dir}/opentofu.log"),
    }

    running_processes = {}
    start_times = {}
    for name, (run_func, log_path) in processes.items():
        click.echo(f"Starting {name}")
        click.echo(f"{name} log: {log_path}")
        start_times[name] = time.time()
        process = await run_func(log_dir)
        running_processes[name] = process
        click.echo(f"{name} PID: {process.pid}")

    await asyncio.sleep(1)  # Wait for local server to start

    results = {}
    durations = {}
    for name, process in running_processes.items():
        results[name] = await wait_for_process(process)
        end_time = time.time()
        durations[name] = timedelta(seconds=int(end_time - start_times[name]))

    if "Local Server" in running_processes:
        try:
            running_processes["Local Server"].terminate()
            await running_processes["Local Server"].wait()
        except ProcessLookupError:
            click.echo("Local server process has already terminated.")
        except Exception as e:
            click.echo(f"Error terminating local server: {e}")

    click.echo("--- Deployment Summary ---")
    for name, success in results.items():
        status = click.style('SUCCESS', fg='green') if success else click.style('FAILED', fg='red')
        click.echo(f"{name}: {status}")
        log_file = processes[name][1]
        click.echo(f"Log file: {log_file}")
        click.echo(f"Duration: {durations[name]}")
        click.echo("")  # Add a blank line for readability

    if all(results.values()):
        click.echo(click.style("All processes completed successfully.", fg='green'))
        
        # Run OpenTofu to update task set scales
        click.echo("Running OpenTofu to update task set scales")
        

        start_time = time.time()
        end_time = time.time()
        duration = timedelta(seconds=int(end_time - start_time))

        status = click.style('SUCCESS', fg='green') if success else click.style('FAILED', fg='red')
        click.echo(f"OpenTofu task set update: {status}")
        click.echo(f"Duration: {duration}")
        
        exit(0 if success else 1)
    else:
        click.echo(click.style("One or more processes failed. Check the logs for details.", fg='red'))
        exit(1)

if __name__ == "__main__":
    cli()