import asyncio
import logging

logger = logging.getLogger("django.temp")


def run_command(command, log_file, env=None, verbose=True):
    process = asyncio.create_subprocess_shell(
        command,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.STDOUT,
        env=env,
        start_new_session=True,  # Add this line
    )

    def log_output():
        with open(log_file, "w") as f:
            while True:
                line = process.stdout.readline()
                if not line:
                    break
                line = line.decode("utf-8").strip()
                if verbose:
                    logger.debug(line)  # Print to stdout only if verbose
                f.write(line + "\n")
                f.flush()

    log_output()
    return_code = process.wait()

    if return_code != 0:
        raise RuntimeError(f"Command '{command}' failed with return code {return_code}")
    return True
