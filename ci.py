import os
import asyncio
from datetime import datetime
import sys
import time
import click

from deploy_stack import run_deploy

async def run_django_setup_and_selenium(log_file, verbose=True):
    if verbose:
        click.echo("Running Django setup and Selenium tests...")
    commands = [
        "python manage.py flush --noinput",
        "python manage.py createsuperuser --noinput --username admin@example.com --email admin@example.com",
        "python manage.py shell -c \"from django.contrib.auth.models import User; user = User.objects.get(username='admin@example.com'); user.set_password('admin123'); user.save()\"",
        "python manage.py migrate",
        "python manage.py runserver & ",
        "sleep 2 && ",
        "selenium-side-runner --config-file config.json selenium/tests.side"
    ]
    
    env = os.environ.copy()
    env.update({
        "DJANGO_SETTINGS_MODULE": "bluewind.settings_test",
    })
    
    command = "".join(commands)
    return await run_command(command, log_file, env=env, verbose=verbose)


async def run_command(command, log_file, env=None, verbose=True):
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
                if verbose:
                    print(line)  # Print to stdout only if verbose
                f.write(line + '\n')
                f.flush()
    
    await log_output()
    await process.wait()
    return process.returncode == 0

async def run_local_tests(log_file, verbose=True):
    if verbose:
        click.echo("Running tests locally...")
    env = os.environ.copy()
    env.update({
        "DJANGO_SETTINGS_MODULE": "bluewind.settings_test",
        "ENVIRONMENT": "test",
        "TEST_HOST": "localhost",
        "ALLOWED_HOSTS": "localhost,",
        "TEST_PORT": "8002"
    })
    
    command = "python3 manage.py test"
    return await run_command(command, log_file, env=env, verbose=verbose)

async def run_tests_against_staging(log_file, verbose=True):
    if verbose:
        click.echo("Running tests against staging...")
    env = os.environ.copy()
    env.update({
        "ENVIRONMENT": "test",
        "DJANGO_SETTINGS_MODULE": "bluewind.settings_test",
        "TEST_HOST": "bluewind-app-alb-1550506744.us-west-2.elb.amazonaws.com",
        "TEST_PORT": "80",
        "ALLOWED_HOSTS": "bluewind-app-alb-1550506744.us-west-2.elb.amazonaws.com,"
    })
    command = "python3 manage.py test"
    return await run_command(command, log_file, env=env, verbose=verbose)

async def run_docker_tests(log_file, verbose=True):
    if verbose:
        click.echo("Running Docker tests...")
    commands = [
        "docker build -t my-django-app .",
        "docker run my-django-app sh -c 'ls -la /code'",
        "docker run -e ENVIRONMENT=test -e DEBUG=1 -e SECRET_KEY=your_secret_key_here "
        "-e DJANGO_SETTINGS_MODULE=bluewind.settings_test "
        "-e ALLOWED_HOSTS=localhost,127.0.0.1 -e CSRF_TRUSTED_ORIGINS=http://localhost,http://127.0.0.1 "
        "-e TEST_HOST=localhost -e TEST_PORT=8000 "
        "my-django-app sh -c '"
        "cd /code && "
        "python manage.py runserver 0.0.0.0:8000 & "
        "sleep 5 && "  # Give the server time to start
        "python manage.py test'"
    ]
    command = " && ".join(commands)
    return await run_command(command, log_file, verbose=verbose)

async def run_all_commands(log_dir, verbose=False):
    async def timed_run(name, coroutine, verbose=verbose):
        log_file = os.path.join(log_dir, f"{name}_tests.log")
        start_time = time.time()
        success = await coroutine(log_file, verbose)
        duration = time.time() - start_time
        return name, success, duration

    start_time = time.time()
    tasks = [
        timed_run('local', run_local_tests),
        timed_run('staging', run_tests_against_staging),
        timed_run('docker', run_docker_tests),
        timed_run('selenium', run_django_setup_and_selenium),
        timed_run('deploy', run_deploy, verbose=True)
    ]

    results = await asyncio.gather(*tasks)
    total_duration = time.time() - start_time

    return {name: {'success': success, 'duration': duration} for name, success, duration in results}, total_duration

@click.command()
@click.argument('command', type=click.Choice(['local', 'staging', 'docker', 'deploy', 'selenium', 'full']))
@click.option('--log-dir', default=None, help='Log directory path')
@click.option('--verbose', is_flag=True, help='Enable verbose output')
def cli(command, log_dir, verbose):
    asyncio.run(async_cli(command, log_dir, verbose))

async def async_cli(command, log_dir, verbose):
    if log_dir is None:
        reverse_timestamp = str(9999999999 - int(time.time())).zfill(10)
        log_dir = f"./logs/{reverse_timestamp}"
    
    os.makedirs(log_dir, exist_ok=True)

    if command == 'full':
        click.echo("Starting full test and deploy process...")
        results, total_duration = await run_all_commands(log_dir, verbose)
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
                success = await run_local_tests(log_file, verbose=True)
            elif command == 'staging':
                success = await run_tests_against_staging(log_file, verbose=True)
            elif command == 'docker':
                success = await run_docker_tests(log_file, verbose=True)
            elif command == 'selenium':
                success = await run_django_setup_and_selenium(log_file, verbose=True)
            elif command == 'deploy':
                success = await run_deploy(log_file, verbose=True)
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