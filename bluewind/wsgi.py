import os

from django.core.wsgi import get_wsgi_application

from bluewind.context_variables import (
    get_log_records,
    set_log_records,
    set_request_id,
    set_workspace_id,
)
from bluewind.push_logs import push_logs_to_db

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "bluewind.settings_prod")


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

        app = django_app(environ, start_response)
        push_logs_to_db(2, workspace_id, get_log_records())
        return app

    return wrapper


# Get the default Django WSGI application
django_application = get_wsgi_application()

# Apply our middleware
application = workspace_wsgi_middleware(django_application)
