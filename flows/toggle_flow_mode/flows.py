import logging

from flow_runs.models import FlowRun
from user_settings.models import UserSettings

logger = logging.getLogger("django.not_used")


def toggle_flow_mode(flow_run):
    user_settings = UserSettings.objects.filter(user_id=1).first()
    if user_settings.mode == UserSettings.Mode.FLOW:
        user_settings.mode = UserSettings.Mode.MANUAL
    else:
        user_settings.mode = UserSettings.Mode.FLOW
    user_settings.save()
    flow_run.status = FlowRun.Status.COMPLETED
