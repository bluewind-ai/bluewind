import os
import asyncio
from datetime import datetime
import time
import click

from ci_utils import run_command
from deploy_stack import run_deploy

import asyncio
import os
import asyncio
import os

async def run_e2e_dev_green(log_file, verbose=True, env_modifiers={}, additional_args=None):
    env_modifiers = {
        "SITE_PORT": "8001",
        "SITE_URL": "localhost"
    }
    env = os.environ.copy()
    env.update(env_modifiers)
    
    base_command = "npx playwright test --project=chromium --reporter=list"
    full_command = f"{base_command} {additional_args}" if additional_args else base_command
    
    return await run_command(full_command, log_file, env=env, verbose=verbose)

async def run_e2e_prod_green(log_file, verbose=True):
    env_modifiers={"SITE_PORT": "8080"}
    env = os.environ.copy()
    # modify env
    env.update(env_modifiers)
    return await run_command("SITE_PORT=8080 npx playwright test --project=chromium --reporter=list", log_file, env=env, verbose=verbose)

async def run_e2e_prod(log_file, verbose=True):
    server_process = None
    return await run_command("SITE_PORT=443 SITE_URL=https://app.bluewind.ai npx playwright test --project=chromium --reporter=list", log_file, env=None, verbose=verbose)


async def run_e2e_local(log_file, verbose=True):
    env = os.environ.copy()
    env.update({
        "DJANGO_SETTINGS_MODULE": "bluewind.settings_prod",
        "SITE_URL": "http://localhost:8000",
        "DJANGO_SUPERUSER_EMAIL": "admin@example.com",
        "DJANGO_SUPERUSER_PASSWORD": "admin123"
    })

    setup_commands = [
        "python manage.py migrate"
    ]

    server_process = None
    try:
        for cmd in setup_commands:
            await run_command(cmd, log_file, env=env, verbose=verbose)

        server_process = await asyncio.create_subprocess_shell(
            "python manage.py runserver",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=env
        )

        await asyncio.sleep(2)  # Wait for server to start

        await run_command("npx playwright test --project=chromium --reporter=list", log_file, env=env, verbose=verbose)
        
        return True
    except Exception:
        return False
    finally:
        if server_process:
            try:
                return True
                server_process.terminate()
                server_process.kill()
                await server_process.wait()
            except asyncio.TimeoutError:
                print("couldn't kill the server")

async def run_local_unit_tests(log_file, verbose=True):
    if verbose:
        click.echo("Running unit tests locally...")
    
    command = "python3 manage.py test"
    return await run_command(command, log_file, env=None, verbose=verbose)

async def run_all_commands(log_dir, verbose=False):
    async def timed_run(name, coroutine, verbose=verbose):
        log_file = os.path.join(log_dir, f"{name}_tests.log")
        start_time = time.time()
        success = await coroutine(log_file, verbose)
        duration = time.time() - start_time
        return name, success, duration

    start_time = time.time()
    tasks = [
        # timed_run('local_unit_tests', run_local_unit_tests),
        # timed_run('staging', run_tests_against_staging),
        # timed_run('docker', run_docker_tests),
        timed_run('e2e_local', run_e2e_local),
        timed_run('e2e_prod', run_e2e_prod),
        # timed_run('e2e_staging', run_e2e_staging),
        timed_run('deploy', run_deploy, verbose=True)
    ]

    results = await asyncio.gather(*tasks)
    total_duration = time.time() - start_time

    return {name: {'success': success, 'duration': duration} for name, success, duration in results}, total_duration

@click.command()
@click.argument('command', type=click.Choice(['local_unit_tests', 'staging', 'docker', 'deploy', 'e2e_local', 'e2e_prod', 'e2e_prod_green', 'e2e_staging', 'full', 'e2e_dev_green']))
@click.option('--log-dir', default=None, help='Log directory path')
@click.option('--verbose', is_flag=True, help='Enable verbose output')
@click.argument('additional_args', required=False)
def cli(command, log_dir, verbose, additional_args):
    asyncio.run(async_cli(command, log_dir, verbose, additional_args))

async def async_cli(command, log_dir, verbose, additional_args):
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
            if command == 'local_unit_tests':
                success = await run_local_unit_tests(log_file, verbose=True)
            # elif command == 'staging':
                # success = await run_tests_against_staging(log_file, verbose=True)
            # elif command == 'docker':
            #     success = await run_docker_tests(log_file, verbose=True)
            elif command == 'e2e_local':
                return await run_e2e_local(log_file, verbose=True)
            elif command == 'e2e_prod':
                return await run_e2e_prod(log_file, verbose=True)
            elif command == 'e2e_prod_green':
                return await run_e2e_prod_green(log_file, verbose=True)
            elif command == 'e2e_dev_green':
                return await run_e2e_dev_green(log_file, verbose=True, additional_args=additional_args)
            # elif command == 'e2e_staging':
            #     success = await run_e2e_staging(log_file, verbose=True)
            elif command == 'deploy':
                return await run_deploy(log_file, verbose=True)
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