import logging

from bluewind.context_variables import set_function_call
from function_calls.models import FunctionCall
from functions.approve_function_call.v2.functions import approve_function_call_v2
from functions.go_next.v2.functions import go_next_v2
from functions.handle_function_call_after_save.v1.functions import (
    handle_function_call_after_save_v1,
)
from functions.master.v1.functions import master_v1

logger = logging.getLogger("django.temp")


# @bluewind_function_v1()
def replay_until_here_v1(function_name_to_reach):
    FunctionCall.objects.filter(status__in=FunctionCall.uncompleted_stages()).update(
        status=FunctionCall.Status.CANCELLED
    )
    master_v1()
    function_call_id, _, _ = go_next_v2()
    other_object_than_function_call = None

    current_function_name = FunctionCall.objects.get(pk=function_call_id).function.name
    first_iteration_done = False
    logger.debug(current_function_name != function_name_to_reach)
    logger.debug(not first_iteration_done)

    while current_function_name != function_name_to_reach:
        if other_object_than_function_call:
            set_function_call(other_object_than_function_call.function_call)
            other_object_than_function_call.save()
            handle_function_call_after_save_v1(other_object_than_function_call)
            other_object_than_function_call.function_call.refresh_from_db()
        else:
            function_call = FunctionCall.objects.get(pk=function_call_id)
            approve_function_call_v2(function_call)
        function_call_id, _, other_object_than_function_call = go_next_v2()
        current_function_name = FunctionCall.objects.get(
            pk=function_call_id
        ).function.name
        first_iteration_done = True

    return function_call_id
