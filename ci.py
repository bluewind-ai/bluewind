import os
import asyncio
from datetime import datetime
import sys
import time
import click

from deploy_stack import run_deploy

async def run_command(command, log_file, env=None, background=False):
    process = await asyncio.create_subprocess_shell(
        command,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.STDOUT,
        env=env
    )
    
    async def log_output():
        with open(log_file, 'w') as f:
            while True:
                line = await process.stdout.readline()
                if not line:
                    break
                line = line.decode('utf-8').strip()
                f.write(line + '\n')
                f.flush()
    
    if background:
        asyncio.create_task(log_output())
        return process
    else:
        await log_output()
        await process.wait()
        return process.returncode == 0

async def run_local_tests(log_file, background=True):
    click.echo("Running tests locally...")
    env = os.environ.copy()
    env.update({
        "ENVIRONMENT": "test",
        "TEST_HOST": "localhost",
        "ALLOWED_HOSTS": "localhost,",
        "TEST_PORT": "8002"
    })
    
    command = "python3 manage.py test"
    return await run_command(command, log_file, env=env, background=background)

async def run_tests_against_staging(log_file, background=True):
    click.echo("Running tests against staging...")
    env = os.environ.copy()
    env.update({
        "ENVIRONMENT": "test",
        "TEST_HOST": "bluewind-app-alb-1550506744.us-west-2.elb.amazonaws.com",
        "TEST_PORT": "80",
        "ALLOWED_HOSTS": "bluewind-app-alb-1550506744.us-west-2.elb.amazonaws.com,"
    })
    command = "python3 manage.py test"
    return await run_command(command, log_file, env=env, background=background)

async def run_docker_tests(log_file, background=True):
    click.echo("Running Docker tests...")
    commands = [
        "docker build -t my-django-app .",
        "docker run my-django-app sh -c 'ls -la /code'",
        "docker run -e ENVIRONMENT=test -e DEBUG=1 -e SECRET_KEY=your_secret_key_here "
        "-e ALLOWED_HOSTS=localhost,127.0.0.1 -e CSRF_TRUSTED_ORIGINS=http://localhost,http://127.0.0.1 "
        "-e TEST_HOST=localhost -e TEST_PORT=8000 "
        "my-django-app sh -c '"
        "cd /code && "
        "python manage.py runserver 0.0.0.0:8000 & "
        "sleep 5 && "  # Give the server time to start
        "python manage.py test'"
    ]
    command = " && ".join(commands)
    return await run_command(command, log_file, background=background)

async def run_all_commands(log_dir):
    async def timed_run(name, coroutine, background=True):
        start_time = time.time()
        result = await coroutine
        if background:
            await result.wait()  # Wait for the background process to complete
            success = result.returncode == 0
        else:
            success = result
        duration = time.time() - start_time
        return name, success, duration

    start_time = time.time()
    tasks = [
        timed_run('local', run_local_tests(os.path.join(log_dir, "local_tests.log"))),
        timed_run('staging', run_tests_against_staging(os.path.join(log_dir, "staging_tests.log"))),
        timed_run('docker', run_docker_tests(os.path.join(log_dir, "docker_tests.log"))),
        timed_run('deploy', run_deploy(os.path.join(log_dir, "deploy.log")), background=False)
    ]

    results = await asyncio.gather(*tasks)
    total_duration = time.time() - start_time

    return {name: {'success': success, 'duration': duration} for name, success, duration in results}, total_duration

@click.command()
@click.argument('command', type=click.Choice(['local', 'staging', 'docker', 'deploy', 'full']))
@click.option('--log-dir', default=None, help='Log directory path')
def cli(command, log_dir):
    if log_dir is None:
        reverse_timestamp = str(9999999999 - int(time.time())).zfill(10)
        log_dir = f"./logs/{reverse_timestamp}"
    
    os.makedirs(log_dir, exist_ok=True)

    if command == 'full':
        results, total_duration = asyncio.run(run_all_commands(log_dir))
        overall_success = all(result['success'] for result in results.values())
        status_text = "Success" if overall_success else "Failure"
        click.echo(f"Full run: {click.style(status_text, fg='green' if overall_success else 'red')}")
        for cmd, data in results.items():
            status = "Success" if data['success'] else "Failure"
            status_color = 'green' if data['success'] else 'red'
            click.echo(f"{cmd}: {click.style(status, fg=status_color)} - logs here -> {os.path.join(log_dir, f'{cmd}_tests.log')} (Time: {data['duration']:.2f} seconds)")
        click.echo(f"\nTotal time: {total_duration:.2f} seconds")
        success = overall_success
    else:
        log_file = os.path.join(log_dir, f"{command}_tests.log")
        start_time = time.time()
        success = False  # Initialize success to False
        try:
            if command == 'local':
                success = asyncio.run(run_local_tests(log_file, background=False))
            elif command == 'staging':
                success = asyncio.run(run_tests_against_staging(log_file, background=False))
            elif command == 'docker':
                success = asyncio.run(run_docker_tests(log_file, background=False))
            elif command == 'deploy':
                success = asyncio.run(run_deploy(log_file))
            else:
                click.echo(f"Unknown command: {command}")
        except Exception as e:
            click.echo(f"An error occurred: {str(e)}")
        
        duration = time.time() - start_time
        
        status = "Success" if success else "Failure"
        status_color = 'green' if success else 'red'
        click.echo(f"{command}: {click.style(status, fg=status_color)} - logs here -> {log_file} (Time: {duration:.2f} seconds)")
    
    exit(0 if success else 1)

if __name__ == "__main__":
    cli()