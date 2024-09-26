import logging
import re

from gevent import subprocess

from flow_runs.models import FlowRun
from flows.models import Flow

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


def handle_failed_flow_run(flow_run):
    """
    Deliver value to your or your business in a variety of ways.

    Args:
        flow_run (FlowRun): The current flow run object.

    Returns:
        None
    """
    # FlowRun.objects.create(
    #     flow=Flow.objects.get(name="check_if_files_are_synchronized_with_the_db"),
    #     user=flow_run.user,
    #     workspace_id=flow_run.workspace_id,
    #     status=FlowRun.Status.READY_FOR_APPROVAL,
    # )

    # FlowRun.objects.create(
    #     flow=Flow.objects.get(name="synchronize_files_with_the_db"),
    #     user=flow_run.user,
    #     workspace_id=flow_run.workspace_id,
    #     status=FlowRun.Status.READY_FOR_APPROVAL,
    # )

    # FlowRun.objects.create(
    #     flow=Flow.objects.get(name="quickly_create_a_new_flow"),
    #     user=flow_run.user,
    #     workspace_id=flow_run.workspace_id,
    #     status=FlowRun.Status.READY_FOR_APPROVAL,
    # )

    # FlowRun.objects.create(
    #     flow=Flow.objects.get(name="rename_flow_runs_to_jobs"),
    #     user=flow_run.user,
    #     workspace_id=flow_run.workspace_id,
    #     status=FlowRun.Status.READY_FOR_APPROVAL,
    # )

    # FlowRun.objects.create(
    #     flow=Flow.objects.get(name="rename_activate_flow_mode_to_disable_flow_mode"),
    #     user=flow_run.user,
    #     workspace_id=flow_run.workspace_id,
    #     status=FlowRun.Status.READY_FOR_APPROVAL,
    # )

    # FlowRun.objects.create(
    #     flow=Flow.objects.get(
    #         name="stop_returning_exceptions_that_point_to_library_code"
    #     ),
    #     user=flow_run.user,
    #     workspace_id=flow_run.workspace_id,
    #     status=FlowRun.Status.READY_FOR_APPROVAL,
    # )

    # FlowRun.objects.create(
    #     flow=Flow.objects.get(name="stop_using_the_flow_mode_by_toggling_create_a_dedicated_button_instead"),
    #     user=flow_run.user,
    #     workspace_id=flow_run.workspace_id,
    #     status=FlowRun.Status.READY_FOR_APPROVAL,
    # )

    FlowRun.objects.create(
        flow=Flow.objects.get(name="avoid_going_into_spam"),
        user=flow_run.user,
        workspace_id=flow_run.workspace_id,
        status=FlowRun.Status.READY_FOR_APPROVAL,
    )


def clean_log_entry(log_entry):
    pattern = r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3} \[.*?\] \[.*?\] .*?: "
    return re.sub(pattern, "", log_entry)


def run_bluewind():
    subprocess.Popen("nohup python manage.py run_bluewind &", shell=True)
