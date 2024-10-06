import logging
from contextvars import ContextVar

request_id_var = ContextVar("request_id")
log_records_var = ContextVar("log_records")
startup_mode_var = ContextVar("startup_mode")

exception_count_var = ContextVar("exception_count", default=0)
file_and_line_where_debugger_with_skipped_option_was_called_var = ContextVar(
    "file_and_line_where_debugger_with_skipped_option_was_called", default=(None, None)
)

logger = logging.getLogger("django.temp")  # noqa: F821


def get_request_id():
    return request_id_var.get()


def set_request_id(request_id):
    request_id_var.set(request_id)


def get_log_records():
    return log_records_var.get()


def set_log_records(log_records):
    log_records_var.set(log_records)


def get_startup_mode():
    return startup_mode_var.get()


def set_startup_mode(startup_mode):
    startup_mode_var.set(startup_mode)


def get_exception_count():
    return exception_count_var.get()


def set_exception_count(exception_count):
    exception_count_var.set(exception_count)


def get_file_and_line_where_debugger_with_skipped_option_was_called():
    return file_and_line_where_debugger_with_skipped_option_was_called_var.get()


def set_file_and_line_where_debugger_with_skipped_option_was_called(
    file_and_line_where_debugger_with_skipped_option_was_called,
):
    file_and_line_where_debugger_with_skipped_option_was_called_var.set(
        file_and_line_where_debugger_with_skipped_option_was_called
    )
