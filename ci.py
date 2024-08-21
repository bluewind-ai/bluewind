import os
import asyncio
from datetime import datetime
import time
import click

async def run_command(command, log_file, env=None, background=False):
    with open(log_file, 'w') as f:
        process = await asyncio.create_subprocess_shell(
            command,
            stdout=f,
            stderr=asyncio.subprocess.STDOUT,
            env=env
        )
        if not background:
            await process.wait()
            return process.returncode == 0
        return process

async def run_local_tests(log_file):
    click.echo("Running tests locally...")
    env = os.environ.copy()
    env.update({
        "ENVIRONMENT": "test",
        "TEST_HOST": "localhost",
        "ALLOWED_HOSTS": "localhost,",
        "TEST_PORT": "8002"
    })
    success = await run_command("python3 manage.py test", log_file, env=env)
    return success

async def run_tests_against_staging(log_file):
    click.echo("Running tests against staging...")
    env = os.environ.copy()
    env.update({
        "ENVIRONMENT": "test",
        "TEST_HOST": "app-bluewind-alb-1840324227.us-west-2.elb.amazonaws.com",
        "ALLOWED_HOSTS": "app-bluewind-alb-1840324227.us-west-2.elb.amazonaws.com,"
    })
    success = await run_command("python3 manage.py test", log_file, env=env)
    return success

async def run_docker_tests(log_file):
    click.echo("Running Docker tests...")
    commands = [
        "docker build -t my-django-app .",
        "docker run my-django-app sh -c 'ls -la /code'",
        "docker run -e ENVIRONMENT=test -e DEBUG=1 -e SECRET_KEY=your_secret_key_here "
        "-e ALLOWED_HOSTS=localhost,127.0.0.1 -e CSRF_TRUSTED_ORIGINS=http://localhost,http://127.0.0.1 "
        "-e TEST_HOST=localhost -e TEST_PORT=8000 "
        "my-django-app sh -c 'cd /code && python manage.py test'"
    ]
    command = " && ".join(commands)
    success = await run_command(command, log_file)
    return success

@click.command()
@click.argument('command', type=click.Choice(['local', 'staging', 'docker']))
@click.option('--log-dir', default=None, help='Log directory path')
def cli(command, log_dir):
    if log_dir is None:
        readable_timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        reverse_timestamp = str(9999999999 - int(time.time())).zfill(10)
        log_dir = f"./logs/{reverse_timestamp}_{readable_timestamp}"
    
    os.makedirs(log_dir, exist_ok=True)
    click.echo(f"Log directory: {log_dir}")

    log_file = os.path.join(log_dir, f"{command}_tests.log")
    click.echo(f"Log file: {log_file}")

    if command == 'local':
        success = asyncio.run(run_local_tests(log_file))
    elif command == 'staging':
        success = asyncio.run(run_tests_against_staging(log_file))
    elif command == 'docker':
        success = asyncio.run(run_docker_tests(log_file))

    if success:
        click.echo(click.style(f"{command.capitalize()} tests completed successfully.", fg='green'))
        click.echo(click.style(f"Log file: {log_file}", fg='green'))
    else:
        click.echo(click.style(f"{command.capitalize()} tests failed.", fg='red'))
        click.echo(click.style(f"Check the log file for details: {log_file}", fg='yellow'))
    
    exit(0 if success else 1)

if __name__ == "__main__":
    cli()