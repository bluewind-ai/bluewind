def push_logs_to_db(user_id, workspace_id, log_records):
    from django.db import transaction
    from django.utils import timezone

    from app_logs.models import AppLog

    log_entries = []
    for record in log_records:
        if record["logger"] == "django.db.backends":
            if '"users_user"."id"' not in record["message"]:
                continue

        if "timestamp" in record and isinstance(record["timestamp"], str):
            record["timestamp"] = timezone.datetime.fromisoformat(record["timestamp"])
            if timezone.is_naive(record["timestamp"]):
                record["timestamp"] = timezone.make_aware(record["timestamp"])

        recorded_request_id = (
            None if record["request_id"] == "no_request_id" else record["request_id"]
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

    with open("logs/request_id.log", "a") as f:
        f.write(str(log_records) + "\n")
    with transaction.atomic():
        AppLog.objects.bulk_create(log_entries)
