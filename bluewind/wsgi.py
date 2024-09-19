import os

from manage import load_env  # noqa

load_env()  # noqa

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "bluewind.settings_prod")

import django  # noqa

django.setup()  # noqa

from django.core.wsgi import get_wsgi_application  # noqa

application = get_wsgi_application()

# Now it's safe to import your project-specific modules

from bluewind.context_variables import set_startup_mode, set_workspace_id  # noqa


def workspace_wsgi_middleware(django_app):
    def wrapper(environ, start_response):
        path_info = environ["PATH_INFO"]
        workspace_id = 2

        if path_info.startswith("/workspaces/"):
            parts = path_info.split("/")
            workspace_id = parts[2]
            environ["SCRIPT_NAME"] = f"/workspaces/{workspace_id}"
            environ["PATH_INFO"] = "/" + "/".join(parts[3:])

        set_workspace_id(int(workspace_id))

        return django_app(environ, start_response)

    return wrapper


# Apply our middleware
application = workspace_wsgi_middleware(application)

set_workspace_id(1)
from bluewind import startup  # noqa

from flows.sigint_handler.flows import sigint_handler  # noqa

worker_int = sigint_handler()

set_startup_mode(False)
# # Register the signal handler
