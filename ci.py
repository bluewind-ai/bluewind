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
        process = await asyncio.create_subprocess_shell(
            command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
            env=env
        )
        
        with open(log_file, 'w') as f:
            while True:
                line = await process.stdout.readline()
                if not line:
                    break
                line = line.decode('utf-8').strip()
                print(line)  # Print to stdout
                f.write(line + '\n')  # Write to log file
        
        await process.wait()
        return process.returncode == 0

async def run_local_tests(log_file, background=False):
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

async def run_tests_against_staging(log_file, background=False):
    click.echo("Running tests against staging...")
    env = os.environ.copy()
    env.update({
        "ENVIRONMENT": "test",
        "TEST_HOST": "app-bluewind-alb-1840324227.us-west-2.elb.amazonaws.com",
        "ALLOWED_HOSTS": "app-bluewind-alb-1840324227.us-west-2.elb.amazonaws.com,"
    })
    command = "python3 manage.py test"
    return await run_command(command, log_file, env=env, background=background)

async def run_docker_tests(log_file, background=False):
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
    async def timed_run(name, coroutine):
        start_time = time.time()
        result = await coroutine
        duration = time.time() - start_time
        return name, result, duration

    start_time = time.time()
    tasks = [
        timed_run('local', run_local_tests(os.path.join(log_dir, "local_tests.log"), background=True)),
        timed_run('staging', run_tests_against_staging(os.path.join(log_dir, "staging_tests.log"), background=True)),
        timed_run('docker', run_docker_tests(os.path.join(log_dir, "docker_tests.log"), background=True)),
        timed_run('deploy', run_deploy(os.path.join(log_dir, "deploy.log")))
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
        print(f"Full run: {'Success' if overall_success else 'Failure'}")
        for cmd, data in results.items():
            status = "Success" if data['success'] else "Failure"
            print(f"{cmd}: {status} - logs here -> {os.path.join(log_dir, f'{cmd}_tests.log')} (Time: {data['duration']:.2f} seconds)")
        print(f"\nTotal time: {total_duration:.2f} seconds")
    else:
        log_file = os.path.join(log_dir, f"{command}_tests.log")
        start_time = time.time()
        if command == 'local':
            success = asyncio.run(run_local_tests(log_file, False))
        elif command == 'staging':
            success = asyncio.run(run_tests_against_staging(log_file, False))
        elif command == 'docker':
            success = asyncio.run(run_docker_tests(log_file, False))
        elif command == 'deploy':
            success = asyncio.run(run_deploy(log_file, False))
        else:
            click.echo(f"Unknown command: {command}")
            success = False
        duration = time.time() - start_time
        
        status = "Success" if success else "Failure"
        print(f"{command}: {status} - logs here -> {log_file} (Time: {duration:.2f} seconds)")
    
    exit(0 if (overall_success if command == 'full' else success) else 1)

if __name__ == "__main__":
    cli()