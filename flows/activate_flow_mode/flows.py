import logging

from users.models import User

logger = logging.getLogger("django.not_used")


def activate_flow_mode():
    UserSettings.objects.update(user=User.objects.get(id=1), flow_mode=True)
