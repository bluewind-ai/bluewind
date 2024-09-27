import importlib
import logging

from bluewind.context_variables import set_approved_function_call
from function_calls.models import FunctionCall
from functions.bluewind_function.v1.functions import bluewind_function_v1

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


@bluewind_function_v1()
def handle_query_params_v1(query_params, function_call_id):
    function_name = query_params.get("function")
    if function_name == "approve_function_call":
        function_call = FunctionCall.objects.get(id=function_call_id)

        function_call.status = FunctionCall.Status.APPROVED
        function_call.save()
        # Assume the function is in the current module if no module is specified
        function_name = function_call.function.name

        func_name = function_name
        module = importlib.import_module("functions.master.v1.functions")
        # raise Exception(module, func_name)
        func = getattr(module, func_name)
        set_approved_function_call(function_call)
        return func()
