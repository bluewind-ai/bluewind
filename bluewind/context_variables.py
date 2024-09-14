from contextvars import ContextVar

request_id_var = ContextVar("request_id")
log_records_var = ContextVar("log_records")
workspace_id_var = ContextVar("workspace_id")
startup_mode_var = ContextVar("startup_mode", default=True)


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
