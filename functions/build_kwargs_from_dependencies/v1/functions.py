import logging
from contextvars import ContextVar

# from bluewind.custom_exception import debugger
from function_call_dependencies.models import FunctionCallDependency
from function_calls.models import FunctionCall
from functions.to_camel_case.v1.functions import to_camel_case_v1  # noqa: F401

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821
is_function_call_magic_var = ContextVar("is_function_call_magic", default=False)


def build_kwargs_from_dependencies_v1(function_call):
    new_kwargs = {}
    function_call_dependencies = FunctionCallDependency.objects.filter(
        dependent=function_call
    )
    from functions.bluewind_function.v1.functions import custom_deserialize

    if function_call.function.name == "query_apollo_company_searches_v1":
        for key, value in function_call.input_data.items():
            new_kwargs[key] = value

    for dependency in function_call_dependencies:
        if dependency.dependency.output_type != FunctionCall.OutputType.QUERY_SET:
            new_kwargs[dependency.name] = dependency.dependency.output_data
            continue
        new_kwargs[dependency.name] = custom_deserialize(
            function_call.input_data[dependency.name]
        )
    for key, value in function_call.input_data.items():
        if (
            function_call.function.name == "mark_domain_name_as_scanned_v1"
        ):  # TODO: remove hardcoding
            new_kwargs[key] = custom_deserialize(value)

    return new_kwargs
