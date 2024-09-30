import logging

from function_call_dependencies.models import FunctionCallDependency  # noqa: F401

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


class Debugger(Exception):
    _call_counts = {}

    def __init__(self, message, catch_nth_call):
        super().__init__(str(message))
        self.message = str(message)
        self.catch_nth_call = catch_nth_call

    def __call__(self):
        key = (self.message, self.catch_nth_call)
        self._call_counts[key] = self._call_counts.get(key, 0) + 1
        if self._call_counts[key] >= self.catch_nth_call:
            raise self


debugger = Debugger


def build_function_call_dependencies_v1(function_call, kwargs, args):
    debugger(function_call, catch_nth_call=1)()

    if kwargs == {}:
        return
    dependency_count = 0
    for key, value in kwargs.items():
        FunctionCallDependency.objects.create(
            dependency=value, dependent=function_call, name=key
        )
        dependency_count += 1
    return dependency_count
