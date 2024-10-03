import logging

from django.shortcuts import redirect  # noqa: F401

from function_calls.models import FunctionCall

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


def restart_v1():
    from functions.master.v1.functions import master_v1

    FunctionCall.objects.filter(status__in=FunctionCall.uncompleted_stages()).update(
        status=FunctionCall.Status.CANCELLED
    )
    master_v1()
    function_call = FunctionCall.objects.filter(
        status=FunctionCall.Status.READY_FOR_APPROVAL
    ).first()
    return redirect(f"/admin/function_calls/functioncall/{function_call.id}/change")
