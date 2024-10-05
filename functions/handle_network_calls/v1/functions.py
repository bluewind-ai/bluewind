import logging

from function_calls.models import FunctionCall

logger = logging.getLogger("django.not_used")


def handle_network_calls_v1(func, kwargs, function_call):
    cached_data = FunctionCall.objects.filter(
        input_data=kwargs,
        status__in=FunctionCall.successful_terminal_stages(),
        function=function_call.function,
    ).first()
    if cached_data:
        return cached_data.output_data
    return func(**kwargs)
