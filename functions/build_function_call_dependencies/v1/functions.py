import logging

from function_call_dependencies.models import FunctionCallDependency  # noqa: F401

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


def build_function_call_dependencies_v1(function_call, kwargs):
    if kwargs == {}:
        return
    dependency_count = 0
    for value in set(kwargs.values()):
        FunctionCallDependency.objects.create(
            dependency=value,
            dependent=function_call,
        )
        dependency_count += 1
    return dependency_count
