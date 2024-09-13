import uuid
from contextvars import ContextVar

from django.db import transaction
from django.utils import timezone

request_id_var = ContextVar("request_id", default=None)
log_records_var = ContextVar("log_records", default=None)

is_logging_operation = False


class RequestIDMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_id = str(uuid.uuid4())
        request_id_var.set(request_id)
        log_records_var.set([])
        request.id = request_id

        try:
            response = self.get_response(request)
        except Exception as e:
            # Log the exception with traceback
            add_log_record(
                {
                    "timestamp": timezone.now().isoformat(),
                    "level": "ERROR",
                    "request_id": request_id,
                    "logger": "django.request",
                    "message": str(e),
                    "traceback": traceback.format_exc(),  # Capture and include the traceback
                }
            )
            raise  # Re-raise the exception after logging

        self.save_app_logs(request)
        return response

    @transaction.atomic
    def save_app_logs(self, request):
        global is_logging_operation
        from app_logs.models import AppLog

        # Avoid infinite loop by checking the logging operation flag
        if is_logging_operation:
            return

        log_records = log_records_var.get()
        workspace_id = request.environ.get("WORKSPACE_ID")

        if not workspace_id:
            return  # Skip saving logs if there's no workspace

        is_logging_operation = True

        for record in log_records:
            if record.get("logger") == "django.db.backends":
                continue

            # Ensure datetime is properly formatted
            if "timestamp" in record and isinstance(record["timestamp"], str):
                record["timestamp"] = timezone.datetime.fromisoformat(
                    record["timestamp"]
                )
                if timezone.is_naive(record["timestamp"]):
                    record["timestamp"] = timezone.make_aware(record["timestamp"])

            # Set the user for the log entry
            user = request.user if request.user.is_authenticated else None
            if not user:
                continue  # Skip saving the log entry if user is None

            # Save the log entry, including the traceback if any
            log_entry = AppLog(
                user=user,
                workspace_id=workspace_id,
                message=record["message"],
                level=record["level"],
                timestamp=record["timestamp"],
                logger=record["logger"],
                traceback=record.get("traceback", ""),  # Store traceback if present
            )
            log_entry.save()

        is_logging_operation = False


def get_current_request_id():
    return request_id_var.get()


def add_log_record(record):
    log_records = log_records_var.get()
    if log_records is not None:
        log_records.append(record)
