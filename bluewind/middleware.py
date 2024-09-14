from django.shortcuts import redirect
from django.utils import timezone

from bluewind.context_variables import log_records_var, request_id_var
from incoming_http_requests.models import (
    IncomingHTTPRequest,  # Replace 'your_app' with the actual app name
)


def custom_middleware(get_response):
    def middleware(request):
        user_id = request.user.id if request.user.is_authenticated else 2
        workspace_id = request.environ.get("WORKSPACE_ID", 2)

        incoming_request = IncomingHTTPRequest.objects.create(
            workspace_id=workspace_id, user_id=user_id
        )
        request_id = str(incoming_request.id)
        request_id_var.set(request_id)

        if request.path == "/":
            return get_response(request)
        if request.path == "/accounts/login/":
            return get_response(request)
        if not request.user.is_authenticated:
            return redirect("/accounts/login/")

        get_response(request)
        log_records = log_records_var.get()

        with open("logs/request_id.log", "a") as f:
            f.write(str(log_records) + "\n")

        for record in log_records:
            if record["logger"] == "django.db.backends":
                continue

            if "timestamp" in record and isinstance(record["timestamp"], str):
                record["timestamp"] = timezone.datetime.fromisoformat(
                    record["timestamp"]
                )
                if timezone.is_naive(record["timestamp"]):
                    record["timestamp"] = timezone.make_aware(record["timestamp"])

            if record["request_id"] == "no_request_id":
                recorded_request_id = None
            else:
                recorded_request_id = record["request_id"]

            from app_logs.models import AppLog  # noqa DO NOT MOVE THIS IMPORT

            log_entry = AppLog(
                user_id=user_id,
                workspace_id=workspace_id,
                message=record["message"],
                level=record["level"],
                timestamp=record["timestamp"],
                logger=record["logger"],
                traceback=record.get("traceback", ""),
                incoming_http_request_id=recorded_request_id,
            )
            log_entry.save()
        return get_response(request)

    return middleware
