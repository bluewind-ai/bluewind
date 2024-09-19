import logging
import os  # noqa

import django  # noqa
from django.core.asgi import get_asgi_application  # noqa

from manage import load_env  # noqa

# Set the Django settings module
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "bluewind.settings_prod")
load_env()
# Initialize Django
django.setup()

from bluewind.context_variables import set_startup_mode, set_workspace_id  # noqa
from flows.bootstrap.flows import bootstrap  # noqa
from flows.on_exit_handler.flows import on_exit_handler  # noqa

django_asgi_app = get_asgi_application()

logger = logging.getLogger("django.not_used")


def workspace_asgi_middleware(asgi_app):
    async def wrapper(scope, receive, send):
        if scope["type"] == "http":
            original_path = scope["path"]
            workspace_id = 2

            if original_path.startswith("/workspaces/"):
                parts = original_path.split("/")
                if len(parts) > 2:
                    workspace_id = parts[2]
                    # Set root_path to /workspaces/{id}
                    scope["root_path"] = f"/workspaces/{workspace_id}"
                    # Don't modify path_info
                    # scope["path"] remains unchanged

            set_workspace_id(int(workspace_id))

        return await asgi_app(scope, receive, send)

    return wrapper


set_workspace_id(1)
set_startup_mode(False)

bootstrap()

worker_int = on_exit_handler

# Apply the middleware to the Django ASGI application
application = workspace_asgi_middleware(django_asgi_app)

port = "8000"  # Assuming you're using port 8000

print("\n" + "=" * 40)
print("Server is running!")
print(f"Port:     {port}")
print(f"Local:    http://127.0.0.1:{port}")
print("=" * 40 + "\n")
