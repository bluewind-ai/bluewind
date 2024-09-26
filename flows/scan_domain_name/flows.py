import logging

from flow_runs.models import FlowRun
from flows.models import Flow

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


def scan_domain_name(flow_run, domain_name):
    """
    I am going to check if you have implemented best practices to avoid going into spam, ok?

    Args:
        flow_run (FlowRun): The current flow run object.

    Returns:
        None
    """
    FlowRun.objects.create(
        flow=Flow.objects.get(name="avoid_going_into_spam"),
        user=flow_run.user,
        workspace_id=flow_run.workspace_id,
        status=FlowRun.Status.READY_FOR_APPROVAL,
    )

    flow_run.status = FlowRun.Status.COMPLETED_READY_FOR_APPROVAL
