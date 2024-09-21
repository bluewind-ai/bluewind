import logging
import os

from asgiref.sync import sync_to_async

from daphne_processes.models import DaphneProcess
from file_watchers.models import FileWatcher

logger = logging.getLogger("django.not_used")


@sync_to_async
def update_daphne_processes(pid):
    DaphneProcess.objects.filter(
        master_pid=pid, status=DaphneProcess.Status.RUNNING
    ).update(status=DaphneProcess.Status.TERMINATED)

    FileWatcher.objects.filter(status=FileWatcher.Status.TERMINATED)


def on_exit_handler(server):
    logger.debug("SIGINT_HANDLER")
    update_daphne_processes(os.getpid())

    server.stop()
