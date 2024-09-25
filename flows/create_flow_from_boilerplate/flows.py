import logging

from flow_runs.models import FlowRun
from flows.models import Flow

# Patch standard library
logger = logging.getLogger("django.temp")  # noqa: F821


def create_flow_from_boilerplate(flow_run, flow_name, flow_to_clone):
    """
    I am going to check if you have implemented best practices to avoid going into spam, ok?

    Args:
        flow_run (FlowRun): The current flow run object.

    Returns:
        None
    """
    FlowRun.objects.create(
        flow=Flow.objects.get(name="copy_folder_contents"),
        user=flow_run.user,
        workspace_id=flow_run.workspace_id,
        status=FlowRun.Status.READY_FOR_APPROVAL,
    )
