import uuid

from django.utils import timezone

from bluewind.context_variables import log_records_var, request_id_var


class RequestIDMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_id = str(uuid.uuid4())
        request_id_var.set(request_id)

        response = self.get_response(request)
        log_records = log_records_var.get()
        workspace_id = request.environ.get("WORKSPACE_ID", 2)
        with open("logs/request_id.log", "a") as f:
            f.write(str(log_records) + "\n")
        for record in log_records:
            if record["logger"] == "django.db.backends":
                continue
                # if (
                #     "app_logs_applog" in record["message"]
                #     or "query_logs_querylog" in record["message"]
                # ):
                #     continue

            if "timestamp" in record and isinstance(record["timestamp"], str):
                record["timestamp"] = timezone.datetime.fromisoformat(
                    record["timestamp"]
                )
                if timezone.is_naive(record["timestamp"]):
                    record["timestamp"] = timezone.make_aware(record["timestamp"])

            user_id = (
                request.user.id if request.user.is_authenticated else 2
            )  # the anonymous user
            request_id_in_logs = record["request_id"]
            # if request_id != request_id_in_logs:
            #     raise Exception(
            #         "request_id is not the same in the request and the log records"
            #     )

            from app_logs.models import AppLog  # noqa

            if record["request_id"] == "no_request_id":
                recorded_request_id = None
            else:
                recorded_request_id = record["request_id"]
            log_entry = AppLog(
                user_id=2,
                workspace_id=workspace_id,
                message=record["message"],
                level=record["level"],
                timestamp=record["timestamp"],
                logger=record["logger"],
                traceback=record.get("traceback", ""),
                request_id=recorded_request_id,
            )
            log_entry.save()
        log_records_var.set([])

        return response
