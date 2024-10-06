import logging

# from bluewind.custom_exception import debugger
from function_call_dependencies.models import FunctionCallDependency
from function_calls.models import FunctionCall

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


def build_function_call_dependencies_v1(
    function_call, user, function_call_to_approve, kwargs
):
    from functions.bluewind_function.v1.functions import custom_serialize

    if kwargs == {}:
        return
    dependency_count = 0
    for key, value in kwargs.items():
        if value.__class__.__name__ == "QuerySet":
            function_call_to_approve.input_data[key] = custom_serialize(value)
            function_call_to_approve.output_type = FunctionCall.OutputType.QUERY_SET
            function_call_to_approve.save()
        else:
            if key in ["function_call", "user"]:
                continue
            FunctionCallDependency.objects.create(
                function_call=function_call,
                user=user,
                dependency=value,
                dependent=function_call_to_approve,
                name=key,
            )
            dependency_count += 1
    return dependency_count
