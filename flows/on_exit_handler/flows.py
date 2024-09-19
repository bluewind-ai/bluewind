import logging
import os

from asgiref.sync import sync_to_async

from gunicorn_instances.models import GunicornInstance

logger = logging.getLogger("django.debug")


@sync_to_async
def update_gunicorn_instances(master_pid):
    return GunicornInstance.objects.filter(
        master_pid=master_pid, status=GunicornInstance.Status.RUNNING
    ).update(status=GunicornInstance.Status.TERMINATED)


async def on_exit_handler(server):
    logger.debug("SIGINT_HANDLER")
    await update_gunicorn_instances(os.getppid())
    server.stop()
