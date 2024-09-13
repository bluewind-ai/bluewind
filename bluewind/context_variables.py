from contextvars import ContextVar

request_id_var = ContextVar("request_id")
log_records_var = ContextVar("log_records")
