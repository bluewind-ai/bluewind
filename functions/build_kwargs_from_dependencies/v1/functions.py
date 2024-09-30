import importlib
import logging
from contextvars import ContextVar

# from bluewind.custom_exception import debugger
from function_call_dependencies.models import FunctionCallDependency
from functions.to_camel_case.v1.functions import to_camel_case_v1  # noqa: F401

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821
is_function_call_magic_var = ContextVar("is_function_call_magic", default=False)


def build_kwargs_from_dependencies_v1(function_call, kwargs):
    new_kwargs = {}
    function_call_dependencies = FunctionCallDependency.objects.filter(
        dependent=function_call
    )

    for dependency in function_call_dependencies:
        model_name = to_camel_case_v1(dependency.name)
        domain_name_module = importlib.import_module("domain_names.models")
        domain_name_class = getattr(domain_name_module, model_name)
        ids = dependency.dependency.output_data["domain_name"]
        if len(ids) == 1:
            new_kwargs[dependency.name] = domain_name_class.objects.get(id__in=ids)
        else:
            raise Exception("todo")
    debugger(function_call_dependencies, kwargs)

    return new_kwargs
