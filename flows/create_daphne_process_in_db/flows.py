import logging
import os

from daphne_processes.models import DaphneProcess
from flows.file_watchers_init.flows import file_watchers_init

logger = logging.getLogger("django.temp")


def create_daphne_process_in_db():
    pid = os.getpid()
    daphne_process = DaphneProcess.objects.filter(
        master_pid=pid,
    ).first()
    logger.debug("DaphneProcess created.")
    if not daphne_process:
        DaphneProcess.objects.create(
            master_pid=pid, status=DaphneProcess.Status.RUNNING
        )
        logger.debug("DaphneProcess created.")
        file_watchers_init()
