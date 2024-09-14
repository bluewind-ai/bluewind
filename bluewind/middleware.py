from django.db import transaction
from django.shortcuts import redirect
from django.utils import timezone

from app_logs.models import AppLog
from bluewind.context_variables import log_records_var, request_id_var
from incoming_http_requests.models import IncomingHTTPRequest


def custom_middleware(get_response):
    def middleware(request):
        user_id = request.user.id if request.user.is_authenticated else 2
        workspace_id = request.environ.get("WORKSPACE_ID", 2)

        request_id = request_id_var.get()

        IncomingHTTPRequest.objects.filter(id=request_id).update(user_id=user_id)

        if request.path == "/":
            return get_response(request)
        if request.path == "/accounts/login/":
            return get_response(request)
        if not request.user.is_authenticated:
            return redirect("/accounts/login/")

        response = get_response(request)
        log_records = log_records_var.get()

        with open("logs/request_id.log", "a") as f:
            f.write(str(log_records) + "\n")

        log_entries = []
        for record in log_records:
            if record["logger"] == "django.db.backends":
                if '"users_user"."id"' not in record["message"]:
                    continue

            if "timestamp" in record and isinstance(record["timestamp"], str):
                record["timestamp"] = timezone.datetime.fromisoformat(
                    record["timestamp"]
                )
                if timezone.is_naive(record["timestamp"]):
                    record["timestamp"] = timezone.make_aware(record["timestamp"])

            recorded_request_id = (
                None
                if record["request_id"] == "no_request_id"
                else record["request_id"]
            )

            log_entries.append(
                AppLog(
                    user_id=user_id,
                    workspace_id=workspace_id,
                    message=record["message"],
                    level=record["level"],
                    timestamp=record["timestamp"],
                    logger=record["logger"],
                    traceback=record.get("traceback", ""),
                    incoming_http_request_id=recorded_request_id,
                )
            )

        # Bulk create log entries
        with transaction.atomic():
            AppLog.objects.bulk_create(log_entries)

        return response

    return middleware
