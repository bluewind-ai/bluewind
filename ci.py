import os
import asyncio
from datetime import datetime
import time
from datetime import timedelta
import click

async def create_log_directory():
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

async def run_opentofu(log_dir, display_output=False, extra_vars=None):
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
    if extra_vars:
        env.update(extra_vars)
    
    commands = [
        "cd opentf_deploy",
        "tofu init",
        f"tofu apply -lock=false --auto-approve"
    ]
    
    command = " && ".join(commands)
    log_file = f"{log_dir}/opentofu_{int(time.time())}.log"

    if display_output:
        process = await asyncio.create_subprocess_shell(
            command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
            env=env
        )
        with open(log_file, 'w') as f:
            async for line in process.stdout:
                line = line.decode()
                click.echo(line, nl=False)
                f.write(line)
        await process.wait()
        return process
    else:
        return await run_command(command, log_file, env=env)

@click.group()
def cli():
    pass

@cli.command()
def deploy():
    """Only run OpenTofu and display its output"""
    asyncio.run(async_main(deploy=True))

@cli.command()
def full():
    """Run all deployment processes"""
    asyncio.run(async_main(deploy=False))

async def async_main(deploy):
    log_dir = await create_log_directory()
    click.echo(f"Log directory: {log_dir}")

    if deploy:
        # Only run OpenTofu
        click.echo("Running OpenTofu only")
        opentofu_log = f"{log_dir}/opentofu.log"
        click.echo(f"OpenTofu log: {opentofu_log}")
        start_time = time.time()
        opentofu_process = await run_opentofu(log_dir, display_output=True)
        

        success = await wait_for_process(opentofu_process)
        end_time = time.time()
        duration = timedelta(seconds=int(end_time - start_time))

        status = click.style('SUCCESS', fg='green') if success else click.style('FAILED', fg='red')
        click.echo(f"OpenTofu: {status}")
        click.echo(f"Log file: {opentofu_log}")
        click.echo(f"Duration: {duration}")

        if success:
            click.echo("Running OpenTofu to update task set scales")
            extra_vars = {
                "TF_VAR_scale_value_task_set_a": "50",
                "TF_VAR_scale_value_task_set_b": "50"
            }
            start_time = time.time()
            opentofu_process = await run_opentofu(log_dir, display_output=True, extra_vars=extra_vars)
            success = await wait_for_process(opentofu_process)
            end_time = time.time()
            duration = timedelta(seconds=int(end_time - start_time))

            status = click.style('SUCCESS', fg='green') if success else click.style('FAILED', fg='red')
            click.echo(f"OpenTofu task set update: {status}")
            click.echo(f"Duration: {duration}")
        exit(0 if success else 1)

    else:
        # Run all other processes
        processes = {
            "Local Server": (run_local_server, f"{log_dir}/local_server.log"),
            "Local Tests": (run_local_tests, f"{log_dir}/local_tests.log"),
            "Staging Tests": (run_tests_against_staging, f"{log_dir}/staging_tests.log"),
            "Docker Tests": (run_docker_tests, f"{log_dir}/docker_tests.log"),
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

        # Run OpenTofu last
        click.echo("Starting OpenTofu")
        opentofu_log = f"{log_dir}/opentofu.log"
        click.echo(f"OpenTofu log: {opentofu_log}")
        start_time = time.time()
        opentofu_process = await run_opentofu(log_dir, display_output=False)
        results["OpenTofu"] = await wait_for_process(opentofu_process)
        end_time = time.time()
        durations["OpenTofu"] = timedelta(seconds=int(end_time - start_time))

        click.echo("--- Deployment Summary ---")
        for name, success in results.items():
            status = click.style('SUCCESS', fg='green') if success else click.style('FAILED', fg='red')
            click.echo(f"{name}: {status}")
            log_file = opentofu_log if name == "OpenTofu" else processes.get(name, (None, None))[1]
            click.echo(f"Log file: {log_file}")
            click.echo(f"Duration: {durations[name]}")
            click.echo("")  # Add a blank line for readability

        if all(results.values()):
            click.echo(click.style("All processes completed successfully.", fg='green'))
            exit(0)
        else:
            click.echo(click.style("One or more processes failed. Check the logs for details.", fg='red'))
            exit(1)

if __name__ == "__main__":
    cli()