import logging

from flow_runs.models import FlowRun
from user_settings.models import UserSettings

logger = logging.getLogger("django.not_used")


def disable_flow_mode(flow_run):
    UserSettings.objects.filter(user_id=1).update(mode=UserSettings.Mode.MANUAL)
    flow_run.status = FlowRun.Status.COMPLETED
