import logging

from functions.avoid_going_into_spam.v1.functions import avoid_going_into_spam_v1
from functions.bootstrap.v1.functions import bootstrap_v1

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


def master_v1():
    """
    Summary:

    """
    bootstrap_v1()
    avoid_going_into_spam_v1()
