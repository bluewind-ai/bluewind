from flows.on_exit_handler.flows import on_exit_handler
from flows.bootstrap.flows import bootstrap
import os

from django.core.asgi import get_asgi_application

from bluewind.context_variables import set_startup_mode, set_workspace_id
from manage import load_env

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "bluewind.settings_prod")
load_env()

django_asgi_app = get_asgi_application()


async def workspace_asgi_middleware(app):
    async def wrapper(scope, receive, send):
        path_info = scope["path"]
        workspace_id = 2

        if path_info.startswith("/workspaces/"):
            parts = path_info.split("/")
            workspace_id = parts[2]
            scope["root_path"] = f"/workspaces/{workspace_id}"
            scope["path"] = "/" + "/".join(parts[3:])

        set_workspace_id(int(workspace_id))

        await app(scope, receive, send)

    return wrapper


set_workspace_id(1)
set_startup_mode(False)


bootstrap()


worker_int = on_exit_handler


async def application(scope, receive, send):
    middleware = await workspace_asgi_middleware(django_asgi_app)
    await middleware(scope, receive, send)
