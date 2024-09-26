import logging

from function_calls.models import FunctionCall
from functions.models import Function

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821

from allauth.account.views import redirect

from bluewind.context_variables import (
    get_workspace_id,
)


def go_next():
    function_call = FunctionCall.objects.filter(
        status=FunctionCall.Status.MARKED_FAILED,
    ).first()

    if function_call:
        function_call.status = FunctionCall.Status.COMPLETED
        function_call.save()
        function_call = FunctionCall.objects.create(
            function=Function.objects.get(name="handle_failed_function_call"),
            user_id=1,
            input_data={
                "function_call_1": function_call.id,
                "function": function_call.function.id,
            },
            workspace_id=get_workspace_id(),
            status=FunctionCall.Status.READY_FOR_APPROVAL,
        )
        return redirect("/workspaces/1/admin/user")
    function_call = FunctionCall.objects.filter(
        status=FunctionCall.Status.COMPLETED_READY_FOR_APPROVAL,
    ).first()
    if function_call:
        return redirect(
            f"/workspaces/1/admin/function_calls/functioncall/{function_call.id}/change"
        )

    function_call = FunctionCall.objects.filter(
        status=FunctionCall.Status.READY_FOR_APPROVAL,
    ).first()

    if not function_call:
        master_function = Function.objects.get(name="master")
        if not master_function:
            master_function = "test"

        function_call = FunctionCall.objects.create(
            function=master_function,
            user_id=1,
            workspace_id=get_workspace_id(),
            status=FunctionCall.Status.READY_FOR_APPROVAL,
        )
        function_name = "master"
    else:
        function_name = function_call.function.name
    return redirect(
        f"/workspaces/1/admin/function_calls/functioncall/add/?function={function_call.id}&real-function={function_name}"
    )
