import logging

from django.db.models import Q

from function_calls.models import FunctionCall

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


def snake_to_camel_case_uppercase(snake_str):
    components = snake_str.split("_")
    return "".join(x.capitalize() for x in components)


def handle_mark_function_call_as_successful_v1(function_call_id):
    function_call = FunctionCall.objects.get(id=int(function_call_id))
    function_call.status = FunctionCall.Status.MARKED_SUCCESSFUL

    if not get_siblings_in_uncompleted_stages_v1(function_call).exists():
        if function_call.tn_parent:
            function_call.tn_parent.status = (
                FunctionCall.Status.COMPLETED_READY_FOR_APPROVAL
            )
            function_call.tn_parent.save()
    function_call.save()
    return


def get_siblings_in_uncompleted_stages_v1(function_call):
    return FunctionCall.objects.filter(
        ~Q(id__in=[function_call.id]),
        tn_parent=function_call.tn_parent,
        status__in=FunctionCall.uncompleted_stages(),
    )
