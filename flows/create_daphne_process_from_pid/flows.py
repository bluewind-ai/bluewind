import logging
import os

from daphne_processes.models import DaphneProcess

logger = logging.getLogger("django.not_used")


def create_daphne_process_from_pid():
    # Get the parent process ID (Gunicorn master)
    pid = os.getppid()

    # Create and save the GunicornInstance
    instance = DaphneProcess(master_pid=pid, status=DaphneProcess.Status.RUNNING)
    instance.save()
    logger.error(f"Created GunicornInstance with PID: {pid}")

    return {
        "message": f"Created GunicornInstance with PID: {pid}",
        "instance": instance,
    }
