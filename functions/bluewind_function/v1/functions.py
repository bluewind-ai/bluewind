import logging

from django.db import transaction

from bluewind.context_variables import (
    get_approved_function_call,
    get_workspace_id,
    set_approved_function_call,
)
from form_data.models import FormData
from function_calls.models import FunctionCall
from functions.build_function_dependencies.v1.functions import (
    build_function_dependencies_v1,
)
from functions.get_function_or_create_from_file.v1.functions import (
    get_function_or_create_from_file_v1,
)
from functions.get_input_form_or_create_from_file.v1.functions import (
    get_input_form_or_create_from_file_v1,
)
from functions.get_output_form_or_create_from_file.v1.functions import (
    get_output_form_or_create_from_file_v1,
)

logger = logging.getLogger("django.not_used")


import logging
from functools import wraps

logger = logging.getLogger("django.not_used")


import logging

logger = logging.getLogger("django.temp")


def bluewind_function_v1():
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if func.__name__ == "approve_function_call_v1":
                logger.debug(f"{func.__name__} called, do nothing and return")
                return func(*args, **kwargs)

            if get_approved_function_call():
                logger.debug(f"{func.__name__} approved, calling the function")

                set_approved_function_call(None)

                return func(*args, **kwargs)

            logger.debug(
                f"{func.__name__} not approved yet, asking for approval and redirecting"
            )
            with transaction.atomic():
                input_form = get_input_form_or_create_from_file_v1(func)
                input_form_data = None
                if input_form:
                    parameter_function_call = next(iter(kwargs.values()))
                    input_form_data = parameter_function_call.output_form_data
                    if (
                        parameter_function_call.status
                        not in FunctionCall.successful_terminal_stages()
                    ):
                        status = FunctionCall.Status.CONDITIONS_NOT_MET
                output_form = get_output_form_or_create_from_file_v1(func)
                output_form_data = None
                status = FunctionCall.Status.READY_FOR_APPROVAL
                if output_form:
                    output_form_data = FormData.objects.create(
                        data={},
                        form=output_form,
                    )
                function = get_function_or_create_from_file_v1(func.__name__)
                assert function is not None, "function hasn't been found in the DB"
                logger.debug(f"{func.__name__} found in the DB")
                function_call = FunctionCall.objects.create(
                    function=function,
                    parent_id=None,
                    workspace_id=get_workspace_id(),
                    user_id=1,
                    input_parameter_name="todo",
                    input_form_data=input_form_data,
                    output_form_data=output_form_data,
                    status=status,
                )
                remaining_dependencies = build_function_dependencies_v1(
                    function_call, kwargs
                )
                function_call.remaining_dependencies = remaining_dependencies
                function_call.save()
                logger.debug(
                    f"Create function call for {func.__name__} asking for approval"
                )

                return function_call

        return wrapper

    return decorator
