import logging

from function_calls.models import FunctionCall
from functions.approve_function_call.v2.functions import approve_function_call_v2
from functions.go_next.v2.functions import go_next_v2
from functions.handle_function_call_after_save.v1.functions import (
    handle_function_call_after_save_v1,
)

logger = logging.getLogger("django.temp")


# @bluewind_function_v1()
def run_until_complete_v1(
    function_call_id_to_complete,
    statuses_to_reach,
):
    original_function_call = FunctionCall.objects.get(pk=function_call_id_to_complete)
    other_object_than_function_call = None

    current_function_call_id = function_call_id_to_complete
    while True:
        original_function_call.refresh_from_db()

        if (
            original_function_call.status
            == FunctionCall.Status.COMPLETED_READY_FOR_APPROVAL
        ):
            break
        if other_object_than_function_call:
            set_function_call(other_object_than_function_call.function_call)
            set_function(other_object_than_function_call.function_call.function)

            other_object_than_function_call.save()
            handle_function_call_after_save_v1(other_object_than_function_call)
            other_object_than_function_call.function_call.refresh_from_db()
        else:
            function_call = FunctionCall.objects.get(pk=current_function_call_id)
            approve_function_call_v2(function_call)

        current_function_call_id, _, other_object_than_function_call = go_next_v2(
            only_descendants_of=original_function_call
        )
