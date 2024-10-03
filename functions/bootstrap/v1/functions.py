import logging

from bluewind.context_variables import (
    set_function,
    set_function_call,
)
from function_calls.models import FunctionCall
from functions.create_function_from_file.v1.functions import (
    create_function_from_file_v1,
)

logger = logging.getLogger("django.not_used")


def bootstrap_v1():
    master_v1_function = create_function_from_file_v1(function_name="master_v1")
    set_function(master_v1_function)

    status = FunctionCall.Status.RUNNING
    master_v1_function_call = FunctionCall.objects.create(
        status=status, function=master_v1_function, tn_parent=None
    )
    set_function_call(master_v1_function_call)
    status = FunctionCall.Status.COMPLETED
    FunctionCall.objects.create(
        status=status,
        function=create_function_from_file_v1(function_name="bootstrap_v1"),
        tn_parent=master_v1_function_call,
    )
