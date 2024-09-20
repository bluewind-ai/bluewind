import logging
import os
import signal
import subprocess

logger = logging.getLogger("django.debug")


def reload_daphne(daphne_process):
    pid = daphne_process.master_pid
    logger.debug(f"Stopping Daphne process (PID: {pid})")
    os.kill(pid, signal.SIGHUP)

    # Wait for the process to terminate
    try:
        os.waitpid(pid, 0)
    except OSError:
        pass

    logger.debug("Restarting Daphne")
    subprocess.Popen(["python3", "manage.py", "rundaphne"])
    return {"message": "Daphne restarted"}