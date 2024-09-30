import logging
from functools import wraps

from django.db import transaction
from django.utils import timezone

from bluewind.context_variables import (
    get_approved_function_call,
    get_is_function_call_magic,
    get_parent_function_call,
    get_workspace_id,
    set_approved_function_call,
    set_is_function_call_magic,
    set_parent_function_call,
)
from function_calls.models import FunctionCall
from functions.build_function_call_dependencies.v1.functions import (
    build_function_call_dependencies_v1,
)
from functions.build_kwargs_from_dependencies.v1.functions import (
    build_kwargs_from_dependencies_v1,
)
from functions.get_function_or_create_from_file.v1.functions import (
    get_function_or_create_from_file_v1,
)
from functions.get_parameter_names.v1.functions import get_parameter_names_v1
from functions.handle_network_calls.v1.functions import handle_network_calls_v1

logger = logging.getLogger("django.temp")


class MagicFunctionCall:
    def __init__(self, function_call):
        self._function_call = function_call
        self._accessed_attribute = None

    def __getattr__(self, name):
        if get_is_function_call_magic() or hasattr(self._function_call, name):
            self._accessed_attribute = name
            return self
        raise AttributeError(
            f"'{type(self).__name__}' object has no attribute '{name}'"
        )

    def get_accessed_attribute(self):
        return self._accessed_attribute


def bluewind_function_v1(is_making_network_calls=False, redirect=None):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if func.__name__ == "scan_domain_name_v1":
                # raise_debug(
                #     func.__name__,
                #     kwargs,
                #     args,
                # )
                parameter_names = get_parameter_names_v1(func)
                for kwarg in kwargs:
                    if kwarg not in parameter_names:
                        raise_debug(
                            f"The function {func.__name__} uses a kwarg '{kwarg}' which doesn't exist"
                        )

            if args:
                raise Exception("args not supported")

            set_is_function_call_magic(False)

            if func.__name__ == "approve_function_call_v1":
                logger.debug(f"{func.__name__} called, do nothing and return")
                return func(**kwargs)

            if get_approved_function_call():
                logger.debug(f"{func.__name__} approved, calling the function")
                function_call = get_approved_function_call()
                # raise_debug("1", function_call, function_call.output_data)

                new_kwargs = build_kwargs_from_dependencies_v1(function_call)

                set_approved_function_call(None)
                set_parent_function_call(function_call)
                function_call.status = FunctionCall.Status.RUNNING
                # get difference in time between the 2
                if function_call.executed_at:
                    duration = timezone.now() - function_call.executed_at
                    raise_debug(duration)
                function_call.executed_at = timezone.now()
                function_call.input_data = kwargs
                if is_making_network_calls:
                    result = handle_network_calls_v1(func, new_kwargs, function_call)
                    # raise_debug(result, "after_network", func)
                else:
                    result = func(**new_kwargs)

                if not FunctionCall.objects.filter(tn_parent=function_call).exists():
                    if result == None:
                        result = {}
                    function_call.status = (
                        FunctionCall.Status.COMPLETED_READY_FOR_APPROVAL
                    )
                    function_call.output_data = result
                # raise_debug(function_call, function_call.output_data)
                function_call.save()

                return

            logger.debug(
                f"{func.__name__} not approved yet, asking for approval and redirecting"
            )

            with transaction.atomic():
                # input_form = get_input_form_or_create_from_file_v1(func)
                # input_form_data = None
                # if input_form:
                #     parameter_function_call = next(iter(kwargs.values()))
                #     input_form_data = parameter_function_call.output_form_data
                #     if (
                #         parameter_function_call.status
                #         not in FunctionCall.successful_terminal_stages()
                #     ):
                # output_form = get_output_form_or_create_from_file_v1(func)
                # output_form_data = None
                # if output_form:
                #     output_form_data = FormData.objects.create(
                #         data={},
                #         form=output_form,
                #     )
                status = FunctionCall.Status.READY_FOR_APPROVAL
                # get_output_variable_or_create_from_file_v1(func)
                function = get_function_or_create_from_file_v1(func.__name__)
                assert function is not None, "function hasn't been found in the DB"
                logger.debug(f"{func.__name__} found in the DB")
                function_call = FunctionCall.objects.create(
                    function=function,
                    tn_parent=get_parent_function_call(),
                    workspace_id=get_workspace_id(),
                    user_id=1,
                    status=status,
                )
                # raise_debug(func)
                remaining_dependencies = build_function_call_dependencies_v1(
                    function_call, kwargs
                )
                if remaining_dependencies:
                    function_call.remaining_dependencies = remaining_dependencies
                function_call.save()
                if func.__name__ == "master_v1":
                    # raise Exception(
                    #     f"Create function call for {func.__name__} asking for approval"
                    # )
                    pass
                logger.debug(
                    f"Create function call for {func.__name__} asking for approval"
                )

                return function_call

        return wrapper

    return decorator
