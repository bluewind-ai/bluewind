import os

from gunicorn_instances.models import GunicornInstance
from workspaces.models import Workspace


def update_gunicorn_bootstrap_status(status=Workspace.Status.PENDING):
    instance = GunicornInstance.objects.get(master_pid=os.getppid())
    instance.workspace_status = Workspace.Status.PENDING
    instance.save()

    return {}
