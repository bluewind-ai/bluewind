import logging

from flow_runs.models import FlowRun

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


def mark_flow_run_as_successful(flow_run, flow_run_1):
    flow_run_1.status = FlowRun.Status.SUCCESSFUL
    flow_run_1.save()
    flow_run.status = FlowRun.Status.COMPLETED_WAITING_FOR_APPROVAL
