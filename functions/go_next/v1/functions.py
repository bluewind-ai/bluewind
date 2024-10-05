import logging

from function_calls.models import FunctionCall
from functions.master.v1.functions import master_v1
from users.models import User

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


def snake_to_camel_case_uppercase(snake_str):
    components = snake_str.split("_")
    return "".join(x.capitalize() for x in components)


def go_next_v1(request, context):
    function_call = FunctionCall.objects.filter(
        status=FunctionCall.Status.COMPLETED_READY_FOR_APPROVAL
    ).first()

    if function_call:
        return (
            function_call.id,
            f"/function_calls/functioncall/{function_call.id}/change",
        )

    function_call = FunctionCall.objects.filter(
        status=FunctionCall.Status.READY_FOR_APPROVAL
    ).first()

    if function_call:
        if function_call.function.name == "create_domain_name_v1":
            return (
                function_call.id,
                f"/domain_names/domainname/add/?function_call={function_call.id}&name=bluewind.ai",
            )
        return (
            function_call.id,
            f"/function_calls/functioncall/{function_call.id}/change",
        )
    superuser = User.objects.filter(username="wayne@bluewind.ai").first()
    if not superuser:
        master_v1()
        return go_next_v1(request, context)
    raise Exception("NO JOB LEFT")
