import logging
from contextvars import ContextVar

from django.core.signals import request_started
from django.dispatch import receiver

# from bluewind.custom_exception import debugger
from bluewind.context_variables import get_exception_count, set_exception_count
from function_call_dependencies.models import FunctionCallDependency  # noqa: F401

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821
is_function_call_magic_var = ContextVar("is_function_call_magic", default=False)


class Debugger(Exception):
    def __init__(self, *values, skip):
        self.values = values
        self.skip = skip
        super().__init__(self.format_message())

    def format_message(self):
        return ", ".join(map(str, self.values))

    def __call__(self):
        exception_count = get_exception_count()
        if exception_count == self.skip + 1:
            raise Exception(self.format_message())
        else:
            set_exception_count(exception_count + 1)


@receiver(request_started)
def reset_debugger_counts(sender, **kwargs):
    set_exception_count(0)


def debugger(*values, skip):
    return Debugger(*values, skip=skip)()
