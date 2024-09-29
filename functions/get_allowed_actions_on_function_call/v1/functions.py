import logging

from function_calls.models import FunctionCall

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


def get_allowed_actions_on_function_call_v1(function_call):
    """
    Summary:

    """
    allowed_actions = []
    if function_call.status == FunctionCall.Status.READY_FOR_APPROVAL:
        allowed_actions.append("approve_function_call")
    elif function_call.status == FunctionCall.Status.COMPLETED_READY_FOR_APPROVAL:
        allowed_actions.append("mark_function_call_as_failed")
        allowed_actions.append("mark_function_call_as_successful")
    return allowed_actions
