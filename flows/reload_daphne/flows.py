import subprocess
import logging
import os
import signal

logger = logging.getLogger("django.temp")


def reload_daphne(daphne_process):
    pid = daphne_process.master_pid
    logger.debug(f"Stopping Daphne process (PID: {pid})")
    os.kill(pid, signal.SIGTERM)

    # Wait for the process to terminate
    try:
        os.waitpid(pid, 0)
    except OSError:
        pass

    logger.debug("Restarting Daphne")
    subprocess.Popen(["python3", "manage.py", "rundaphne"])
    return {"message": "Daphne restarted"}
