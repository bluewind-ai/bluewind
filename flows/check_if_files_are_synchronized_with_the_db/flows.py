import logging

from flow_runs.models import FlowRun
from flows.models import Flow

# Patch standard library
logger = logging.getLogger("django.temp")  # noqa: F821


def check_if_files_are_synchronized_with_the_db(flow_run):
    """
    Deliver value to your or your business in a variety of ways.

    Args:
        flow_run (FlowRun): The current flow run object.

    Returns:
        None
    """
    FlowRun.objects.create(
        flow=Flow.objects.get(name="create_flow_from_boilerplate"),
        user=flow_run.user,
        workspace_id=flow_run.workspace_id,
        status=FlowRun.Status.READY_FOR_APPROVAL,
    )
