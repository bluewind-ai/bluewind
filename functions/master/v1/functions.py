import logging

from django.shortcuts import redirect

from function_calls.models import FunctionCall
from functions.bluewind_function.v1.functions import bluewind_function_v1

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


@bluewind_function_v1()
def master_v1():
    function_call = FunctionCall.objects.filter(
        status=FunctionCall.Status.READY_FOR_APPROVAL,
    ).first()
    if function_call:
        return redirect(
            f"/workspaces/1/admin/function_calls/functioncall/{function_call.id}/change"
        )
