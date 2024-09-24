import logging

from user_settings.models import UserSettings
from users.models import User

logger = logging.getLogger("django.not_used")


def activate_flow_mode(flow_run):
    UserSettings.objects.update(user=User.objects.get(id=1), flow_mode=True)
