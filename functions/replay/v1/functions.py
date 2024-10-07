import logging

from function_calls.models import FunctionCall
from functions.approve_function_call.v1.functions import approve_function_call_v1

logger = logging.getLogger("django.not_used")
"cdscds"


def replay_v1(function_call, user):
    new_function_call = FunctionCall.objects.create(
        parent=function_call.parent,
        function=function_call.function,
        status=FunctionCall.Status.RUNNING,
        input_data=function_call.input_data,
        user=user,
    )
    approve_function_call_v1(function_call=new_function_call, user=user)
