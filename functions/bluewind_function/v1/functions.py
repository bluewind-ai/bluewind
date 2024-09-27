import logging

from django.shortcuts import redirect

from bluewind.context_variables import (
    get_parent_function_call_id,
    get_workspace_id,
    set_parent_function_call_id,
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

logger = logging.getLogger("django.not_used")


def bluewind_function_v1():
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Before function execution
            function_call = FunctionCall.objects.create(
                function=get_function_or_create_from_file(func.__name__),
                parent_id=get_parent_function_call_id(),
                workspace_id=get_workspace_id(),
                user_id=1,
                status=FunctionCall.Status.READY_FOR_APPROVAL,
            )
            set_parent_function_call_id(function_call.id)

            # Execute the original function
            func(*args, **kwargs)

            return redirect(
                f"/workspaces/1/admin/function_calls/functioncall/{function_call.id}/change"
            )

        return wrapper

    return decorator
