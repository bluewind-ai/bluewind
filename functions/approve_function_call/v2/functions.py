import logging

from function_calls.models import FunctionCall
from functions.approve_function_call.v1.functions import approve_function_call_v1
from functions.handle_mark_function_call_as_successful.v1.functions import (
    handle_mark_function_call_as_successful_v1,
)

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


def approve_function_call_v2(function_call):
    if function_call.status == FunctionCall.Status.READY_FOR_APPROVAL:
        raise_debug("test")
        approve_function_call_v1(function_call_id=function_call.id)
    else:
        handle_mark_function_call_as_successful_v1(function_call_id=function_call.id)
