from contextvars import ContextVar

request_id_var = ContextVar("request_id")
log_records_var = ContextVar("log_records")
workspace_id_var = ContextVar("workspace_id")
startup_mode_var = ContextVar("startup_mode", default=True)
parent_function_call_var = ContextVar("parent_function_call", default=None)
approved_function_call_var = ContextVar("approved_function_call", default=None)
is_function_call_magic_var = ContextVar("is_function_call_magic", default=False)


def get_request_id():
    return request_id_var.get()


def set_request_id(request_id):
    request_id_var.set(request_id)


def get_log_records():
    return log_records_var.get()


def set_log_records(log_records):
    log_records_var.set(log_records)


def get_workspace_id():
    return workspace_id_var.get()


def set_workspace_id(workspace_id):
    workspace_id_var.set(workspace_id)


def get_startup_mode():
    return startup_mode_var.get()


def set_startup_mode(startup_mode):
    startup_mode_var.set(startup_mode)


def get_user_id():
    # TODO
    return 1


def get_approved_function_call():
    return approved_function_call_var.get()


def set_approved_function_call(approved_function_call):
    approved_function_call_var.set(approved_function_call)


def get_parent_function_call():
    return parent_function_call_var.get()


def set_parent_function_call(parent_function_call):
    parent_function_call_var.set(parent_function_call)


def get_is_function_call_magic():
    return is_function_call_magic_var.get()


def set_is_function_call_magic(is_function_call_magic):
    is_function_call_magic_var.set(is_function_call_magic)
