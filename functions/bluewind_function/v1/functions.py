import logging
from functools import wraps

from bluewind.context_variables import (
    get_is_function_call_magic,
)
from functions.handler_bluewind_function.v1.functions import (
    handler_bluewind_function_v1,
)

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
            return handler_bluewind_function_v1(
                func, args, kwargs, is_making_network_calls
            )

        return wrapper

    return decorator
