from bluewind.context_variables import get_workspace_id
from workspaces.models import Workspace


def is_bootstrap_already_pending_or_done():
    is_bootstrap_already_pending_or_done = Workspace.objects.filter(
        id=get_workspace_id(),
        status__in=[Workspace.Status.PENDING, Workspace.Status.DONE],
    ).exists()
    return {"bootstrap_already_pending_or_done": is_bootstrap_already_pending_or_done}
