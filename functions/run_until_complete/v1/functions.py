import logging

from function_calls.models import FunctionCall
from functions.approve_function_call.v2.functions import approve_function_call_v2
from functions.go_next.v2.functions import go_next_v2
from functions.handle_function_call_after_save.v1.functions import (
    handle_function_call_after_save_v1,
)

logger = logging.getLogger("django.temp")


# @bluewind_function_v1()
def run_until_complete_v1(function_call, user):
    other_object_than_function_call = None

    next_function_call = function_call
    redirect_link = ""
    while True:
        function_call.refresh_from_db()

        if (
            next_function_call.status == FunctionCall.Status.REQUIRES_HUMAN_INPUT
            or function_call.status == FunctionCall.Status.COMPLETED_READY_FOR_APPROVAL
        ):
            return next_function_call, redirect_link
        if other_object_than_function_call:
            other_object_than_function_call.save()
            handle_function_call_after_save_v1(
                function_call=function_call,
                user=user,
                object=other_object_than_function_call,
            )
            other_object_than_function_call.function_call.refresh_from_db()
        else:
            approve_function_call_v2(function_call=next_function_call, user=user)

        next_function_call, redirect_link, other_object_than_function_call = go_next_v2(
            function_call=user, user=user, only_descendants_of=function_call
        )
