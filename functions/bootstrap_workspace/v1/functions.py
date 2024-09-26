import logging

from bluewind.context_variables import get_workspace_id
from flows.files_load_all.flows import files_load_all
from workspaces.models import Workspace

logger = logging.getLogger("django.not_used")


def bootstrap_workspace():
    logger.error("Bootstrapping workspace.")
    # raise NotImplementedError("This function is not implemented yet.")
    workspace_id = get_workspace_id()
    workspace_already_bootstrapped = Workspace.objects.filter(
        id=workspace_id,
        bootstrap_status__in=[
            Workspace.BootstrapStatus.PENDING,
            Workspace.BootstrapStatus.DONE,
        ],
    ).exists()
    if workspace_already_bootstrapped:
        logger.debug("Workspace is already bootstrapped, skipping.")
        return

    Workspace.objects.filter(
        id=workspace_id,
    ).update(bootstrap_status=Workspace.BootstrapStatus.PENDING)

    files_load_all()
    logger.debug("Files loaded successfully.")

    Workspace.objects.filter(
        id=workspace_id,
    ).update(bootstrap_status=Workspace.BootstrapStatus.DONE)
