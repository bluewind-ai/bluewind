import os

from daphne_processes.models import DaphneProcess


def create_daphne_process_in_db():
    pid = os.getpid()
    daphne_process = DaphneProcess.objects.filter(
        master_pid=pid,
    ).first()
    if not daphne_process:
        DaphneProcess.objects.create(
            master_pid=pid, status=DaphneProcess.Status.RUNNING
        )
