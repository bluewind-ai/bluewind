import os
import asyncio
import time
import click

async def run_command(command, log_file, env=None):
    with open(log_file, 'w') as f:
        process = await asyncio.create_subprocess_shell(
            command,
            stdout=f,
            stderr=asyncio.subprocess.STDOUT,
            env=env
        )
        return process

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

async def wait_for_process(process, timeout=1800):
    try:
        await asyncio.wait_for(process.wait(), timeout=timeout)
        return process.returncode == 0
    except asyncio.TimeoutError:
        process.terminate()
        await process.wait()
        return False