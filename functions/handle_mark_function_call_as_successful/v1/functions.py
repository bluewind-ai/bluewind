import logging

from django.db.models import Q

from function_calls.models import FunctionCall
from functions.go_next.v1.functions import go_next_v1

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


def snake_to_camel_case_uppercase(snake_str):
    components = snake_str.split("_")
    return "".join(x.capitalize() for x in components)


def handle_mark_function_call_as_successful_v1(request, context, function_call_id):
    function_call = FunctionCall.objects.get(id=int(function_call_id))
    function_call.status = FunctionCall.Status.MARKED_SUCCESSFUL
    if not FunctionCall.objects.filter(
        ~Q(id__in=[function_call.id]),
        tn_parent_id=function_call.tn_parent_id,
        status__in=FunctionCall.uncompleted_stages(),
    ).exists():
        if function_call.tn_parent:
            function_call.tn_parent.status = (
                FunctionCall.Status.COMPLETED_READY_FOR_APPROVAL
            )
            function_call.parent.save()

    function_call.save()
    return go_next_v1(request, context)
