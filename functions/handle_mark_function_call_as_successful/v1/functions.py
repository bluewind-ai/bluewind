import logging

from function_calls.models import FunctionCall
from functions.go_next.v1.functions import go_next_v1

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


def snake_to_camel_case_uppercase(snake_str):
    components = snake_str.split("_")
    return "".join(x.capitalize() for x in components)


def handle_mark_function_call_as_successful_v1(function_call_id):
    function_call = FunctionCall.objects.get(id=int(function_call_id))
    function_call.status = FunctionCall.Status.MARKED_SUCCESSFUL
    # raise Exception(
    #     FunctionCall.objects.filter(
    #         parent_id=function_call.parent_id,
    #         status__in=FunctionCall.uncompleted_stages(),
    #     ).exists()
    # )
    if not FunctionCall.objects.filter(
        parent_id=function_call.parent_id,
        status__in=FunctionCall.uncompleted_stages(),
    ).exists():
        function_call.parent.status = FunctionCall.Status.COMPLETED_READY_FOR_APPROVAL
        function_call.parent.save()

    function_call.save()
    return go_next_v1()
