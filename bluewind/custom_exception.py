import inspect

from django.core.signals import request_started
from django.dispatch import receiver

from bluewind.context_variables import (
    get_exception_count,
    get_file_and_line_where_debugger_with_skipped_option_was_called,
    set_exception_count,
    set_file_and_line_where_debugger_with_skipped_option_was_called,
)


class Debugger(Exception):
    def __init__(self, *values, skip):
        self.values = values
        self.skip = skip
        super().__init__(self.format_message())

    def format_message(self):
        return ", ".join(map(str, self.values))

    def __call__(self):
        exception_count = get_exception_count()
        if exception_count == self.skip:
            raise Exception(self.format_message())
        else:
            set_exception_count(exception_count + 1)


@receiver(request_started)
def reset_raise_debug_counts(sender, **kwargs):
    from bluewind.context_variables import set_exception_count

    set_exception_count(0)


def raise_debug(*values, skip=0):
    if skip != 0:
        check_if_we_use_skip_in_different_place()
    return Debugger(*values, skip=skip)()


def check_if_we_use_skip_in_different_place():
    file, line = get_caller_info()

    previous_file, previous_line = (
        get_file_and_line_where_debugger_with_skipped_option_was_called()
    )
    # raise Exception("ncdjskjncds")
    if (previous_file, previous_line) != (
        file,
        line,
    ):
        raise Exception(
            f"you can't use skip on raise_debug() in different parts of the code. It can only be used once. you asked it here: {file}:{line}. But it was also called here: {previous_file}:{previous_line}",
        )
    set_file_and_line_where_debugger_with_skipped_option_was_called(
        (
            file,
            line,
        )
    )


def get_caller_info(depth=2):
    frame = inspect.currentframe()
    for _ in range(depth + 1):
        if frame.f_back is None:
            break
        frame = frame.f_back

    filename = frame.f_code.co_filename
    line_number = frame.f_lineno
    return filename, line_number
