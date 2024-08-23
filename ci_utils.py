import asyncio

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
    return_code = await process.wait()
    
    if return_code != 0:
        raise RuntimeError(f"Command '{command}' failed with return code {return_code}")