from contextvars import ContextVar

request_id_var = ContextVar("request_id")
log_records_var = ContextVar("log_records")
startup_mode_var = ContextVar("startup_mode")

parent_function_call_var = ContextVar("parent_function_call", default=None)
approved_function_call_var = ContextVar("approved_function_call", default=None)
is_function_call_magic_var = ContextVar("is_function_call_magic", default=False)
exception_count_var = ContextVar("exception_count", default=0)
file_and_line_where_debugger_with_skipped_option_was_called_var = ContextVar(
    "file_and_line_where_debugger_with_skipped_option_was_called", default=(None, None)
)

is_update_entity_function_already_in_the_call_stack_var = ContextVar(
    "is_update_entity_function_already_in_the_call_stack", default=False
)
function_call_var = ContextVar("function_call", default=None)
function_var = ContextVar("function_var", default=None)
workspace_var = ContextVar("workspace_var")
superuser_var = ContextVar("superuser_var")


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


def get_approved_function_call():
    return approved_function_call_var.get()


def set_approved_function_call(approved_function_call):
    approved_function_call_var.set(approved_function_call)


def get_parent_function_call():
    return parent_function_call_var.get()


def set_parent_function_call(parent_function_call):
    parent_function_call_var.set(parent_function_call)


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


def get_is_update_entity_function_already_in_the_call_stack():
    return is_update_entity_function_already_in_the_call_stack_var.get()


def set_is_update_entity_function_already_in_the_call_stack(
    is_update_entity_function_already_in_the_call_stack,
):
    is_update_entity_function_already_in_the_call_stack_var.set(
        is_update_entity_function_already_in_the_call_stack
    )


def get_function_call():
    return function_call_var.get()


def set_function_call(
    function_call,
):
    function_call_var.set(function_call)


def get_function():
    return function_var.get()


def set_function(
    function,
):
    function_var.set(function)


def get_workspace():
    return workspace_var.get()


def set_workspace(workspace):
    workspace_var.set(workspace)


def get_superuser():
    return superuser_var.get()


def set_superuser(superuser):
    superuser_var.set(superuser)
