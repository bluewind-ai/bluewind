import logging

from flow_runs.models import FlowRun
from flows.models import Flow

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


def extract_context_from_flow_run(flow_run, issue, flow_run_1):
    FlowRun.objects.create(
        flow=Flow.objects.get(name="extract_context_from_flow_run"),
        user=flow_run.user,
        input_data={"issue": issue, "flow_run_1": flow_run_1},
        workspace_id=flow_run.workspace_id,
        status=FlowRun.Status.READY_FOR_APPROVAL,
    )
