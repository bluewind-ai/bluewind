import logging

from functions.delayed_restart.v1.functions import delayed_restart_v1

logger = logging.getLogger("django.not_used")


# @bluewind_function_v1()
def restart_v1():
    delayed_restart_v1()
