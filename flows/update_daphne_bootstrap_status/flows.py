import os

from daphne_processes.models import DaphneProcess
from workspaces.models import Workspace


def update_gunicorn_bootstrap_status(status=Workspace.Status.PENDING):
    instance = DaphneProcess.objects.get(master_pid=os.getppid())
    instance.workspace_status = Workspace.Status.PENDING
    instance.save()

    return {}
