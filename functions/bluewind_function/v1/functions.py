import logging

from django.db import transaction

from bluewind.context_variables import (
    get_approved_function_call,
    get_workspace_id,
    set_approved_function_call,
)
from function_calls.models import FunctionCall
from functions.get_function_or_create_from_file.functions import (
    get_function_or_create_from_file,
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
            if func.__name__ == "handle_query_params_v1":
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
                function = get_function_or_create_from_file(func.__name__)
                assert function is not None, "function hasn't been found in the DB"
                logger.debug(f"{func.__name__} found in the DB")
                function_call = FunctionCall.objects.create(
                    function=function,
                    parent_id=None,
                    workspace_id=get_workspace_id(),
                    user_id=1,
                    status=FunctionCall.Status.READY_FOR_APPROVAL,
                )
                logger.debug(
                    f"Create function call for {func.__name__} asking for approval"
                )

                return function_call

        return wrapper

    return decorator
