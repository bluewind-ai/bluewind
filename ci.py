from asyncio import subprocess
import os
import asyncio
from datetime import datetime
import sys
import time
import click

from deploy_stack import run_deploy

async def run_command(command, log_file, env=None, background=False):
    if background:
        process = await asyncio.create_subprocess_shell(
            command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=env
        )
        return process
    else:
        with open(log_file, 'w') if isinstance(log_file, str) else log_file as f:
            process = await asyncio.create_subprocess_shell(
                command,
                stdout=f,
                stderr=subprocess.STDOUT,
                env=env
            )
            
            await process.communicate()
        
        return process.returncode == 0

async def run_local_tests(log_file):
    click.echo("Running tests locally...")
    env = os.environ.copy()
    env.update({
        "ENVIRONMENT": "test",
        "TEST_HOST": "localhost",
        "ALLOWED_HOSTS": "localhost,",
        "TEST_PORT": "8002"
    })
    
    command = "python3 manage.py test"
    return await run_command(command, log_file, env=env)

async def run_tests_against_staging(log_file):
    click.echo("Running tests against staging...")
    env = os.environ.copy()
    env.update({
        "ENVIRONMENT": "test",
        "TEST_HOST": "app-bluewind-alb-1840324227.us-west-2.elb.amazonaws.com",
        "ALLOWED_HOSTS": "app-bluewind-alb-1840324227.us-west-2.elb.amazonaws.com,"
    })
    command = "python3 manage.py test"
    return await run_command(command, log_file, env=env)

async def run_docker_tests(log_file):
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
    return await run_command(command, log_file)

async def run_all_commands(log_dir):
    tasks = [
        run_local_tests(os.path.join(log_dir, "local_tests.log")),
        run_tests_against_staging(os.path.join(log_dir, "staging_tests.log")),
        run_docker_tests(os.path.join(log_dir, "docker_tests.log")),
        run_deploy(os.path.join(log_dir, "deploy.log"))
    ]
    results = await asyncio.gather(*tasks)
    return all(results)

@click.command()
@click.argument('command', type=click.Choice(['local', 'staging', 'docker', 'deploy', 'full']))
@click.option('--log-dir', default=None, help='Log directory path')
def cli(command, log_dir):
    if log_dir is None:
        reverse_timestamp = str(9999999999 - int(time.time())).zfill(10)
        log_dir = f"./logs/{reverse_timestamp}"
    
    os.makedirs(log_dir, exist_ok=True)
    # sys.stdout = open(os.path.join(log_dir, 'stdout.log'), 'w')
    # sys.stderr = open(os.path.join(log_dir, 'stderr.log'), 'w')

    if command == 'full':
        success = asyncio.run(run_all_commands(log_dir))
        sys.stdout = sys.__stdout__
        sys.stderr = sys.__stderr__
        status = "Success" if success else "Failure"
        print(f"Full run: {status}")
        for cmd in ['local', 'staging', 'docker', 'deploy']:
            print(f"{cmd}: logs here -> {os.path.join(log_dir, f'{cmd}_tests.log')}")
    else:
        log_file = os.path.join(log_dir, f"{command}_tests.log")
        if command == 'local':
            success = asyncio.run(run_local_tests(log_file))
        elif command == 'staging':
            success = asyncio.run(run_tests_against_staging(log_file))
        elif command == 'docker':
            success = asyncio.run(run_docker_tests(log_file))
        elif command == 'deploy':
            success = asyncio.run(run_deploy(log_file))
        else:
            click.echo(f"Unknown command: {command}")
            success = False
        
        sys.stdout = sys.__stdout__
        sys.stderr = sys.__stderr__
        status = "Success" if success else "Failure"
        print(f"{command}: {status} logs here -> {log_file}")
    
    exit(0 if success else 1)

if __name__ == "__main__":
    cli()