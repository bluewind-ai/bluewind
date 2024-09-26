import logging

from flow_runs.models import FlowRun
from flows.models import Flow

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


def avoid_going_into_spam(flow_run):
    """
    I am going to check if you have implemented best practices to avoid going into spam, ok?

    Args:
        flow_run (FlowRun): The current flow run object.

    Returns:
        None
    """
    flow_run_1 = FlowRun.objects.create(
        flow=Flow.objects.get(name="scan_domain_name"),
        user=flow_run.user,
        workspace_id=flow_run.workspace_id,
        status=FlowRun.Status.READY_FOR_APPROVAL,
        parent=flow_run,
    )
    FlowRun.objects.create(
        flow=Flow.objects.get(name="store_dns_records"),
        user=flow_run.user,
        input_data=,
        input_data_flow_run_id=flow_run_1.id,
        workspace_id=flow_run.workspace_id,
        status=FlowRun.Status.CONDITIONS_NOT_MET,
        parent=flow_run,
    )
    # TBD after this
