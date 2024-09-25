import logging

from flow_runs.models import FlowRun
from flows.models import Flow

# Patch standard library
logger = logging.getLogger("django.temp")  # noqa: F821


def synchronize_files_with_the_db(flow_run):
    """
    Synchronize files with the database.

    Args:
        flow_run (FlowRun): The current flow run object.

    Returns:
        None
    """
    FlowRun.objects.create(
        flow=Flow.objects.get(name="file_watchers_init"),
        user=flow_run.user,
        workspace_id=flow_run.workspace_id,
        status=FlowRun.Status.READY_FOR_APPROVAL,
    )
    flow_run.status = FlowRun.Status.COMPLETED
    flow_run.save()
