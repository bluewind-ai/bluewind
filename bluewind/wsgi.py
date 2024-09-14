import os

from django.core.wsgi import get_wsgi_application

from bluewind.context_variables import (
    get_log_records,
    set_log_records,
    set_request_id,
    set_workspace_id,
)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "bluewind.settings_prod")


def new_func(user_id, workspace_id, log_records):
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

    with transaction.atomic():
        AppLog.objects.bulk_create(log_entries)


def workspace_wsgi_middleware(django_app):
    def wrapper(environ, start_response):
        from incoming_http_requests.models import IncomingHTTPRequest

        set_log_records([])
        path_info = environ.get("PATH_INFO", "")
        parts = path_info.split("/")
        workspace_id = 2
        if path_info.startswith("/static"):
            pass
        elif path_info.startswith("/workspaces/"):
            parts = path_info.split("/")
            workspace_id = parts[2]

            environ["SCRIPT_NAME"] = f"/workspaces/{workspace_id}"
            environ["PATH_INFO"] = "/" + "/".join(parts[3:])

        incoming_request = IncomingHTTPRequest.objects.create(
            workspace_id=workspace_id, user_id=2
        )
        set_workspace_id(workspace_id)

        set_request_id(str(incoming_request.id))

        test = django_app(environ, start_response)
        new_func(2, workspace_id, get_log_records())
        return test

    return wrapper


# Get the default Django WSGI application
django_application = get_wsgi_application()

# Apply our middleware
application = workspace_wsgi_middleware(django_application)
