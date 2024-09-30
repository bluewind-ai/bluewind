import inspect
import logging

logger = logging.getLogger("django.not_used")


def get_parameter_names_v1(function):
    function_parameters = inspect.signature(function).parameters
    return list(function_parameters.keys())
