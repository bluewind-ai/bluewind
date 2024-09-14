import os

from django.core.wsgi import get_wsgi_application

from bluewind.context_variables import set_request_id

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "bluewind.settings_prod")


def workspace_wsgi_middleware(django_app):
    def wrapper(environ, start_response):
        from bluewind.context_variables import log_records_var
        from incoming_http_requests.models import IncomingHTTPRequest

        log_records_var.set([])
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
            environ["WORKSPACE_ID"] = workspace_id
        incoming_request = IncomingHTTPRequest.objects.create(
            workspace_id=workspace_id, user_id=2
        )
        set_request_id(str(incoming_request.id))

        return django_app(environ, start_response)

    return wrapper


# Get the default Django WSGI application
django_application = get_wsgi_application()

# Apply our middleware
application = workspace_wsgi_middleware(django_application)
