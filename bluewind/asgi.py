import os

import django
from django.core.asgi import get_asgi_application

from bluewind.context_variables import set_startup_mode, set_workspace_id
from manage import load_env

# Set the Django settings module
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "bluewind.settings_prod")
load_env()
# Initialize Django
django.setup()


def workspace_asgi_middleware(asgi_app):
    async def wrapper(scope, receive, send):
        if scope["type"] == "http":
            original_path = scope["path"]
            workspace_id = 2

            if original_path.startswith("/workspaces/"):
                parts = original_path.split("/")
                if len(parts) > 2:
                    workspace_id = parts[2]
                    scope["root_path"] = f"/workspaces/{workspace_id}"

            set_workspace_id(int(workspace_id))

        return await asgi_app(scope, receive, send)

    return wrapper


set_workspace_id(1)
set_startup_mode(False)

from flows.bootstrap.flows import bootstrap  # noqa

bootstrap()

# Get the Django ASGI application
django_asgi_app = get_asgi_application()

# Apply the middleware to the Django ASGI application
application = workspace_asgi_middleware(django_asgi_app)
