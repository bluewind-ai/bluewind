import logging
import os

from django.core.wsgi import get_wsgi_application

from bluewind.context_variables import (
    set_startup_mode,
    set_workspace_id,
)
from manage import load_env  # noqa

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "bluewind.settings_prod")

load_env()


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "bluewind.settings_prod")


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


# Get the default Django WSGI application
django_application = get_wsgi_application()

set_workspace_id(1)
set_startup_mode(False)


application = workspace_wsgi_middleware(django_application)

# from flows.on_exit_handler.flows import on_exit_handler  # noqa

# signal.signal(signal.SIGINT, sigint_handler)

# on_exit = on_exit
# HERE
from flows.bootstrap.flows import bootstrap  # noqa

logger = logging.getLogger(__name__)

try:
    bootstrap()
except BaseException:
    logger.exception("Error during bootstrap")
# from flows.bootstrap.flows import bootstrap  # noqa

# when_ready = bootstrap
