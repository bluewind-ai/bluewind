import logging
import re

from gevent import subprocess

from flow_runs.models import FlowRun
from flows.centralize_logs.flows import centralize_logs
from flows.models import Flow

# Patch standard library
logger = logging.getLogger("django.temp")  # noqa: F821


def run_bluewind(flow_run):
    # raise NotImplementedError(model_to_dict(flow_run))
    logger.info("Starting run_bluewind function")

    logger.info("Creating greenlets for centralize_logs and run_gunicorn")
    ran_one_function = False
    if not ran_one_function and not flow_run.state.get("run_gunicorn", False):
        run_gunicorn()

        ran_one_function = True

    if ran_one_function and not flow_run.state.get("centralize_logs", False):
        FlowRun.objects.create(
            user=flow_run.user,
            workspace_id=flow_run.workspace_id,
            input_data={},
            flow=Flow.objects.get(name="centralize_logs"),
            # parent_flow_run=None,
            status=FlowRun.Status.READY,
        )
        centralize_logs()


def clean_log_entry(log_entry):
    pattern = r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3} \[.*?\] \[.*?\] .*?: "
    return re.sub(pattern, "", log_entry)


def run_gunicorn():
    subprocess.Popen("nohup python manage.py rungunicorn &", shell=True)
