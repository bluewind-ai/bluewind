import logging

from bluewind.context_variables import get_workspace_id
from flows.file_watchers_init.flows import file_watchers_init
from flows.files_load_all.flows import files_load_all
from workspaces.models import Workspace

logger = logging.getLogger("django.temp")


def bootstrap_workspace():
    workspace_id = get_workspace_id()
    if Workspace.objects.filter(
        id=workspace_id,
        bootstrap_status__in=[
            Workspace.BootstrapStatus.PENDING,
            Workspace.BootstrapStatus.DONE,
        ],
    ):
        logger.debug("Workspace is already bootstrapped, skipping.")
        return

    Workspace.objects.filter(
        id=workspace_id,
    ).update(bootstrap_status=Workspace.BootstrapStatus.PENDING)

    files_load_all()

    file_watchers_init()

    Workspace.objects.filter(
        id=workspace_id,
    ).update(bootstrap_status=Workspace.BootstrapStatus.DONE)
