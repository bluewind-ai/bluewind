import logging
import re

from gevent import subprocess

from flow_runs.models import FlowRun
from flows.centralize_logs.flows import centralize_logs
from flows.create_a_business.flows import create_a_business
from flows.models import Flow

# Patch standard library
logger = logging.getLogger("django.temp")  # noqa: F821


def deliver_value(flow_run):
    # raise NotImplementedError(model_to_dict(flow_run))
    ran_one_function = False
    if not ran_one_function and not flow_run.state.get("create_a_business", False):
        create_a_business()
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
