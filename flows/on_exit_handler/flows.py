import logging
import os

from asgiref.sync import sync_to_async

from daphne_processes.models import DaphneProcess

logger = logging.getLogger("django.debug")


@sync_to_async
def update_daphne_processes(pid):
    return DaphneProcess.objects.filter(
        master_pid=pid, status=DaphneProcess.Status.RUNNING
    ).update(status=DaphneProcess.Status.TERMINATED)


async def on_exit_handler(server):
    logger.debug("SIGINT_HANDLER")
    await update_daphne_processes(os.getpid())
    server.stop()
