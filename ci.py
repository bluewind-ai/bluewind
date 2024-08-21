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
    if success:
        click.echo(click.style("Local tests completed successfully.", fg='green'))
    else:
        click.echo(click.style("Local tests failed. Check the log for details.", fg='red'))
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
    if success:
        click.echo(click.style("Staging tests completed successfully.", fg='green'))
    else:
        click.echo(click.style("Staging tests failed. Check the log for details.", fg='red'))
    return success

@click.command()
@click.argument('command', type=click.Choice(['local', 'staging']))
@click.option('--log-dir', default=None, help='Log directory path')
def cli(command, log_dir):
    if log_dir is None:
        readable_timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        reverse_timestamp = str(9999999999 - int(time.time())).zfill(10)
        log_dir = f"./logs/{reverse_timestamp}_{readable_timestamp}"
    
    os.makedirs(log_dir, exist_ok=True)
    click.echo(f"Log directory: {log_dir}")

    log_file = os.path.join(log_dir, f"{command}_tests.log")

    if command == 'local':
        success = asyncio.run(run_local_tests(log_file))
    elif command == 'staging':
        success = asyncio.run(run_tests_against_staging(log_file))

    if success:
        click.echo(click.style("Command completed successfully.", fg='green'))
        exit(0)
    else:
        click.echo(click.style("Command failed. Check the logs for details.", fg='red'))
        exit(1)

if __name__ == "__main__":
    cli()