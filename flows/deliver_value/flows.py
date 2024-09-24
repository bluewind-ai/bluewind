import logging
import re

from gevent import subprocess

from flow_runs.models import FlowRun
from flows.avoid_going_into_spam.flows import avoid_going_into_spam
from flows.centralize_logs.flows import centralize_logs
from flows.models import Flow

# Patch standard library
logger = logging.getLogger("django.temp")  # noqa: F821


def deliver_value(flow_run):
    """
    Deliver value to your or your business in a variety of ways.

    Args:
        flow_run (FlowRun): The current flow run object.

    Returns:
        None
    """

    ran_one_function = False
    if not ran_one_function and not flow_run.state.get("avoid_going_into_spam", False):
        FlowRun.objects.create(
            flow=Flow.objects.get(name="avoid_going_into_spam"),
            user=flow_run.user,
            workspace_id=flow_run.workspace_id,
        )
        return
        avoid_going_into_spam(flow_run)
        ran_one_function = True

    if ran_one_function:
        FlowRun.objects.create(
            user=flow_run.user,
            workspace_id=flow_run.workspace_id,
            input_data={},
            flow=Flow.objects.get(name="centralize_logs"),
            # parent_flow_run=None,
            status=FlowRun.Status.READY_FOR_APPROVAL,
        )

        ran_one_function = True
    elif not flow_run.state.get("centralize_logs", False):
        centralize_logs()

        ran_one_function = True


def clean_log_entry(log_entry):
    pattern = r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3} \[.*?\] \[.*?\] .*?: "
    return re.sub(pattern, "", log_entry)


def run_bluewind():
    subprocess.Popen("nohup python manage.py run_bluewind &", shell=True)
