import importlib
import logging

from django.db import transaction

from bluewind.context_variables import (
    get_approved_function_call,
    get_workspace_id,
    set_approved_function_call,
)
from function_call_dependencies.models import FunctionCallDependency
from function_calls.models import FunctionCall
from functions.build_function_call_dependencies.v1.functions import (
    build_function_call_dependencies_v1,
)
from functions.get_function_or_create_from_file.v1.functions import (
    get_function_or_create_from_file_v1,
)
from functions.to_camel_case.v1.functions import to_camel_case_v1

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
                function_call = get_approved_function_call()
                function_call_dependencies = FunctionCallDependency.objects.filter(
                    dependent=function_call
                )
                for dependency in function_call_dependencies:
                    model_name = to_camel_case_v1(dependency.name)
                    domain_name_module = importlib.import_module("domain_names.models")
                    domain_name_class = getattr(domain_name_module, model_name)
                    ids = dependency.data["domain_name"]
                    if len(ids) == 1:
                        kwargs[dependency.name] = domain_name_class.objects.get(
                            id__in=dependency.data["domain_name"]
                        )
                    else:
                        raise Exception("todo")

                set_approved_function_call(None)

                func(*args, **kwargs)
                # function_call.status = FunctionCall.Status.COMPLETED_READY_FOR_APPROVAL

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
                    parent_id=None,
                    workspace_id=get_workspace_id(),
                    user_id=1,
                    status=status,
                )
                remaining_dependencies = build_function_call_dependencies_v1(
                    function_call, kwargs
                )
                if remaining_dependencies:
                    function_call.remaining_dependencies = remaining_dependencies
                function_call.save()
                logger.debug(
                    f"Create function call for {func.__name__} asking for approval"
                )

                return function_call

        return wrapper

    return decorator
