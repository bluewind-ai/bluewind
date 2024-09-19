import logging
import os

from gunicorn_instances.models import GunicornInstance

logger = logging.getLogger("django.temp")


def create_gunicorn_instance_from_pid():
    # Get the parent process ID (Gunicorn master)
    pid = os.getppid()

    # Create and save the GunicornInstance
    instance = GunicornInstance(master_pid=pid, status=GunicornInstance.Status.RUNNING)
    instance.save()
    logger.error(f"Created GunicornInstance with PID: {pid}")

    return {
        "message": f"Created GunicornInstance with PID: {pid}",
        "instance": instance,
    }
