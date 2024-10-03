import logging
from functools import wraps

from django.utils import timezone

from bluewind.context_variables import (
    get_approved_function_call,
    set_approved_function_call,
    set_parent_function_call,
)
from function_calls.models import FunctionCall
from functions.build_function_call_dependencies.v1.functions import (
    build_function_call_dependencies_v1,
)
from functions.build_kwargs_from_dependencies.v1.functions import (
    build_kwargs_from_dependencies_v1,
)
from functions.get_parameter_names.v1.functions import get_parameter_names_v1
from functions.handle_network_calls.v1.functions import handle_network_calls_v1

logger = logging.getLogger("django.temp")

import logging

logger = logging.getLogger("django.temp")
AUTO_APPROVE = [
    "master_v1",
    "bootstrap_v1",
    "create_function_from_file_v1",
    "approve_function_call_v1",
    "get_function_or_create_from_file_v1",
]


def handler_bluewind_function_v1(func, args, kwargs, is_making_network_calls):
    check_args_dont_exist(args)
    check_kwargs_valid(func, kwargs)
    if func.__name__ in AUTO_APPROVE:
        return func(*args, **kwargs)

    if get_approved_function_call():
        function_call = get_approved_function_call()

        new_kwargs = build_kwargs_from_dependencies_v1(function_call)

        set_approved_function_call(None)
        set_parent_function_call(function_call)
        function_call.status = FunctionCall.Status.RUNNING
        # get difference in time between the 2
        if function_call.executed_at:
            duration = timezone.now() - function_call.executed_at
        function_call.executed_at = timezone.now()
        function_call.input_data = kwargs
        if is_making_network_calls:
            result = handle_network_calls_v1(func, new_kwargs, function_call)
        else:
            result = func(**new_kwargs)

        if not FunctionCall.objects.filter(tn_parent=function_call).exists():
            if result == None:
                result = {}
            function_call.status = FunctionCall.Status.COMPLETED_READY_FOR_APPROVAL
            function_call.output_data = result
        function_call.save()

        return

    return ask_for_approval(func, kwargs)


def ask_for_approval(func, kwargs):
    status = FunctionCall.Status.READY_FOR_APPROVAL
    from functions.get_function_or_create_from_file.v1.functions import (
        get_function_or_create_from_file_v1,
    )

    function = get_function_or_create_from_file_v1(function_name=func.__name__)
    assert function is not None, "function hasn't been found in the DB"
    logger.debug(f"{func.__name__} found in the DB")
    # raise Exception(f"Create function call for {func.__name__} asking for approval")
    # raise Exception(f"Create function call for {func.__name__} asking for approval")
    # from django.db import connections

    # for conn in connections.all():
    #     conn.close_if_unusable_or_obsolete()

    function_call = FunctionCall.objects.create(
        status=status,
        function=function,
    )
    # raise_debug(function_call.tn_parent)

    remaining_dependencies = build_function_call_dependencies_v1(function_call, kwargs)
    if remaining_dependencies:
        function_call.remaining_dependencies = remaining_dependencies
        function_call.status = FunctionCall.Status.CONDITIONS_NOT_MET

    # raise_debug(function_call)
    function_call.save()

    if func.__name__ == "master_v1":
        # raise Exception(
        #     f"Create function call for {func.__name__} asking for approval"
        # )
        pass
    logger.debug(f"Create function call for {func.__name__} asking for approval")

    return function_call


def check_kwargs_valid(func, kwargs):
    parameter_names = get_parameter_names_v1(func)
    for kwarg in kwargs:
        if kwarg not in parameter_names:
            raise Exception(
                f"The function {func.__name__} uses a kwarg '{kwarg}' which doesn't exist"
            )


def check_args_dont_exist(args):
    if args:
        raise Exception("args not supported")


def bluewind_function_v1(is_making_network_calls=False, redirect=None):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            return handler_bluewind_function_v1(
                func, args, kwargs, is_making_network_calls
            )

        return wrapper

    return decorator
