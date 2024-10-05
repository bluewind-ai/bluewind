import logging
from contextvars import ContextVar

# from bluewind.custom_exception import raise_debug
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

    for dependency in function_call_dependencies:
        if dependency.dependency.output_type != FunctionCall.OutputType.QUERY_SET:
            new_kwargs[dependency.name] = dependency.dependency.output_data
            continue
        # raise_debug("cndkcndksjn")
        from functions.bluewind_function.v1.functions import custom_deserialize

        # raise_debug(custom_deserialize(function_call.input_data))
        new_kwargs[dependency.name] = custom_deserialize(
            function_call.input_data[dependency.name]
        )
        # for key, value in dependency.dependency.output_data.items():
        #     model_name = to_camel_case_v1(key)
        #     domain_name_module = importlib.import_module("domain_names.models")
        #     domain_name_class = getattr(domain_name_module, model_name)
        #     ids = value
        #     if len(ids) == 1:
        #         new_kwargs[dependency.name] = list(
        #             domain_name_class.objects.filter(id__in=ids)
        #         )
        #     else:
        #         raise ValueError(
        #             f"Expected 1 object, but got {len(ids)} objects for {key}"
        #         )

    return new_kwargs
