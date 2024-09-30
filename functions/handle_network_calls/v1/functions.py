import logging

from function_calls.models import FunctionCall

logger = logging.getLogger("django.temp")


def handle_network_calls_v1(func, kwargs, function_call):
    cached_data = FunctionCall.objects.filter(input_data=kwargs).first()
    if cached_data:
        return cached_data.output_data
    # raise_debug(kwargs, function_call)
    return func(**kwargs)
