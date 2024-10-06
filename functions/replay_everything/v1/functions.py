import logging

from functions.master.v1.functions import master_v1
from functions.reset.v1.functions import reset_v1
from functions.run_until_complete.v1.functions import run_until_complete_v1

logger = logging.getLogger("django.not_used")


def replay_everything_v1(user):
    reset_v1(user=user)
    function_call, _ = master_v1()
    return run_until_complete_v1(function_call=function_call, user=user)
