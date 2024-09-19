import logging
import os

from django.utils import timezone

from manage import load_env  # noqa

logger = logging.getLogger("django.temp")


def on_exit_handler(server):
    logger.debug("SIGINT_HANDLER")
    from gunicorn_instances.models import GunicornInstance

    logger.info(f"[{timezone.now()}] Received SIGINT. Performing cleanup...")
    logger.info(f"Master PID: {os.getppid()}")
    GunicornInstance.objects.filter(
        master_pid=os.getppid(), status=GunicornInstance.Status.RUNNING
    ).update(status=GunicornInstance.Status.TERMINATED)
    logger.info(f"[{timezone.now()}] Cleanup complete.")
