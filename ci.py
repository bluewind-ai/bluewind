import json
import os
import asyncio
from datetime import datetime
import time
from datetime import timedelta
import click
from botocore.exceptions import ClientError
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
    assert task_set_a_scale == 0 or task_set_b_scale == 0, "Both versions are currently running at the same time, we can't deploy"
    if task_set_a_scale == 0 and task_set_b_scale == 0:
        a_is_old = True
    else:
        if task_set_a_scale:
            assert task_set_a_scale == 100, "Task set A is the old version, but it's not scaled to 100%"
            a_is_old = True
        else:
            assert task_set_b_scale == 100, "Task set B is the old version, but it's not scaled to 100%"
            a_is_old = False
    
    task_set_to_update = task_set_a_id.split(',')[0] if a_is_old else task_set_b_id.split(',')[0]
    click.echo(f"Updating task set {task_set_to_update} to 100% scale...")
    
    ecs_client = boto3.client('ecs',
        aws_access_key_id=env['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=env['AWS_SECRET_ACCESS_KEY'],
        region_name='us-west-2'
    )
    response = ecs_client.update_task_set(
        cluster=cluster_arn,
        service=service_name,
        taskSet=task_set_to_update,
        scale={'value': 100, 'unit': 'PERCENT'}
    )
    click.echo(f"Update task set response: {response}")
    
    click.echo("Waiting for service to stabilize...")
    try:
        waiter = ecs_client.get_waiter('services_stable')
        
        # Add a describe_services call before waiting
        click.echo("Describing service before waiting...")
        service_description = ecs_client.describe_services(
            cluster=cluster_arn,
            services=[service_name]
        )
        click.echo(f"Service description: {json.dumps(service_description, default=str, indent=2)}")
        
        waiter.wait(
            cluster=cluster_arn,
            services=[service_name],
            WaiterConfig={
                'Delay': 15,
                'MaxAttempts': 40
            }
        )
        click.echo("Service has stabilized.")
        click.echo("Deployment completed successfully.")
        return True
    except WaiterError as e:
        click.echo(f"WaiterError while waiting for service to stabilize: {str(e)}")
        click.echo("Last response from waiter:")
        click.echo(json.dumps(e.last_response, default=str, indent=2))
    except ClientError as e:
        click.echo(f"ClientError during deployment: {str(e)}")
        if e.response and 'Error' in e.response:
            click.echo(f"Error Code: {e.response['Error'].get('Code')}")
            click.echo(f"Error Message: {e.response['Error'].get('Message')}")
    except Exception as e:
        click.echo(f"Unexpected error during deployment: {str(e)}")
    
    click.echo("Attempting to fetch final service details...")
    try:
        final_service_details = ecs_client.describe_services(
            cluster=cluster_arn,
            services=[service_name]
        )
        click.echo(f"Final service details: {json.dumps(final_service_details, default=str, indent=2)}")
    except Exception as inner_e:
        click.echo(f"Failed to fetch final service details: {str(inner_e)}")
    
    click.echo("Deployment failed.")
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