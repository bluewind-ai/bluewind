import logging

from functions.bluewind_function.v1.functions import bluewind_function_v1
from functions.bootstrap.v1.functions import bootstrap_v1

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


@bluewind_function_v1()
def master_v1():
    """
    Summary:

    """
    bootstrap_v1()
    # avoid_going_into_spam_v1()
