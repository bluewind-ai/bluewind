import os
import asyncio
from datetime import datetime
import time
import click
import aiohttp

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

async def run_local_server_and_tests(log_dir):
    server_log = f"{log_dir}/local_server.log"
    tests_log = f"{log_dir}/local_tests.log"

    # Start local server
    click.echo(f"Starting local server. Log: {server_log}")
    server_process = await run_command(f"gunicorn --bind :8001 --workers 1 bluewind.wsgi", server_log, background=True)
    
    # Check if server is ready
    start_time = time.time()
    server_ready = False
    async with aiohttp.ClientSession() as session:
        while time.time() - start_time < 30:
            try:
                async with session.get("http://localhost:8001") as response:
                    if response.status == 200:
                        server_ready = True
                        break
            except aiohttp.ClientError:
                pass
            await asyncio.sleep(1)

    if not server_ready:
        click.echo(click.style("Failed to start local server. Check the log for details.", fg='red'))
        return False

    # Run local tests
    click.echo(f"Running local tests. Log: {tests_log}")
    env = os.environ.copy()
    env.update({
        "ENVIRONMENT": "test",
        "TEST_HOST": "localhost",
        "ALLOWED_HOSTS": "localhost,",
        "TEST_PORT": "8002"
    })
    tests_success = await run_command("python3 manage.py test", tests_log, env=env)

    if not tests_success:
        click.echo(click.style("Local tests failed. Check the log for details.", fg='red'))
    else:
        click.echo(click.style("Local tests completed successfully.", fg='green'))

    # Terminate the server process
    server_process.terminate()
    await server_process.wait()

    return tests_success

@click.command()
@click.argument('command', default='local')
@click.option('--log-dir', default=None, help='Log directory path')
def cli(command, log_dir):
    if command != 'local':
        click.echo(click.style(f"Unknown command: {command}. Only 'local' is supported.", fg='red'))
        exit(1)

    if log_dir is None:
        readable_timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        reverse_timestamp = str(9999999999 - int(time.time())).zfill(10)
        log_dir = f"./logs/{reverse_timestamp}_{readable_timestamp}"
        os.makedirs(log_dir, exist_ok=True)
    
    click.echo(f"Log directory: {log_dir}")

    success = asyncio.run(run_local_server_and_tests(log_dir))

    if success:
        click.echo(click.style("All processes completed successfully.", fg='green'))
        exit(0)
    else:
        click.echo(click.style("One or more processes failed. Check the logs for details.", fg='red'))
        exit(1)

if __name__ == "__main__":
    cli()