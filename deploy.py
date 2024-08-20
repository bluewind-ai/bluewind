import os
import subprocess
import time
from datetime import datetime
import click

def create_log_directory():
    readable_timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    reverse_timestamp = str(9999999999 - int(time.time())).zfill(10)
    log_dir = f"./logs/{reverse_timestamp}_{readable_timestamp}"
    os.makedirs(log_dir, exist_ok=True)
    return log_dir

def run_command(command, log_file, env=None):
    with open(log_file, 'w') as f:
        process = subprocess.Popen(command, stdout=f, stderr=subprocess.STDOUT, shell=True, env=env)
        return process

def wait_for_process(process, timeout=1800):
    start_time = time.time()
    while process.poll() is None:
        if time.time() - start_time >= timeout:
            process.kill()
            return False
        time.sleep(5)
    return process.returncode == 0

def run_local_server(log_dir):
    click.echo("Starting local server...")
    server_log = f"{log_dir}/local_server.log"
    process = run_command(f"gunicorn --bind :8002 --workers 1 bluewind.wsgi", server_log)
    with open(f"{log_dir}/server.pid", 'w') as f:
        f.write(str(process.pid))
    return process

def run_local_tests(log_dir):
    click.echo("Running tests locally...")
    env = os.environ.copy()
    env.update({
        "ENVIRONMENT": "test",
        "TEST_HOST": "localhost",
        "ALLOWED_HOSTS": "localhost,",
        "TEST_PORT": "8002"
    })
    return run_command("python3 manage.py test", f"{log_dir}/local_tests.log", env=env)

def run_tests_against_staging(log_dir):
    click.echo("Running tests against staging...")
    env = os.environ.copy()
    env.update({
        "ENVIRONMENT": "test",
        "TEST_HOST": "app-bluewind-alb-1840324227.us-west-2.elb.amazonaws.com",
        "ALLOWED_HOSTS": "app-bluewind-alb-1840324227.us-west-2.elb.amazonaws.com,"
    })
    return run_command("python3 manage.py test", f"{log_dir}/staging_tests.log", env=env)

def run_docker_tests(log_dir):
    click.echo("Building Docker image and running tests...")
    commands = [
        "docker build -t my-django-app .",
        "docker run -e ENVIRONMENT=test -e DEBUG=1 -e SECRET_KEY=your_secret_key_here "
        "-e ALLOWED_HOSTS=localhost,127.0.0.1 -e CSRF_TRUSTED_ORIGINS=http://localhost,http://127.0.0.1 "
        "my-django-app python3 manage.py test"
    ]
    return run_command(" && ".join(commands), f"{log_dir}/docker_tests.log")

def run_opentofu(log_dir, display_output=False):
    click.echo("Running OpenTofu commands...")
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
        "tofu apply -lock=false --auto-approve"
    ]
    
    command = " && ".join(commands)
    log_file = f"{log_dir}/opentofu.log"

    if display_output:
        # Run the command and display output in real-time
        with open(log_file, 'w') as f:
            process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, shell=True, env=env, universal_newlines=True)
            for line in process.stdout:
                click.echo(line, nl=False)
                f.write(line)
            process.wait()
        return process
    else:
        # Run the command and log output to file
        return run_command(command, log_file, env=env)

from click import style

@click.command()
@click.option('--tofu', is_flag=True, help="Display OpenTofu output")
def main(tofu):
    log_dir = create_log_directory()
    click.echo(f"Log directory: {log_dir}")

    if tofu:
        opentofu_log = f"{log_dir}/opentofu.log"
        click.echo(f"OpenTofu log: {opentofu_log}")
        run_opentofu(log_dir, display_output=True)

    processes = {
        "Local Server": (run_local_server, f"{log_dir}/local_server.log"),
        "Local Tests": (run_local_tests, f"{log_dir}/local_tests.log"),
        "Staging Tests": (run_tests_against_staging, f"{log_dir}/staging_tests.log"),
        "Docker Tests": (run_docker_tests, f"{log_dir}/docker_tests.log"),
        "OpenTofu": (run_opentofu, f"{log_dir}/opentofu.log")
    }

    running_processes = {}
    for name, (run_func, log_path) in processes.items():
        click.echo(f"Starting {name}")
        click.echo(f"{name} log: {log_path}")
        process = run_func(log_dir)
        running_processes[name] = process
        click.echo(f"{name} PID: {process.pid}")

    time.sleep(2)  # Wait for local server to start

    results = {}
    for name, process in running_processes.items():
        results[name] = wait_for_process(process)

    if "Local Server" in running_processes:
        running_processes["Local Server"].terminate()

    click.echo("--- Deployment Summary ---")
    for name, success in results.items():
        status = style('SUCCESS', fg='green') if success else style('FAILED', fg='red')
        click.echo(f"{name}: {status}")
        click.echo(f"Log file: {processes[name][1]}")

    if all(results.values()):
        click.echo(style("All processes completed successfully.", fg='green'))
        exit(0)
    else:
        click.echo(style("One or more processes failed. Check the logs for details.", fg='red'))
        exit(1)


if __name__ == "__main__":
    main()