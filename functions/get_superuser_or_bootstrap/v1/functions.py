import logging

from functions.bootstrap.v1.functions import bootstrap_v1
from users.models import User

logger = logging.getLogger("django.not_used")


def get_superuser_or_bootstrap_v1():
    superuser = User.objects.filter(pk=1).first()
    if superuser:
        return superuser

    bootstrap_v1()
