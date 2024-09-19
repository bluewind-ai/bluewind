from bluewind.context_variables import get_workspace_id
from workspaces.models import Workspace


def update_workspace_bootstrap_status(status=Workspace.Status.PENDING):
    workspace_id = get_workspace_id()
    instance = Workspace.objects.get(id=workspace_id)
    instance.workspace_status = Workspace.Status.PENDING
    instance.save()

    return {}
