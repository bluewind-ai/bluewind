from django.core.management.base import BaseCommand
from django.core.wsgi import get_wsgi_application
from gunicorn.app.wsgiapp import WSGIApplication

from bluewind.context_variables import set_startup_mode, set_workspace_id


class Command(BaseCommand):
    help = "Runs Gunicorn with the project WSGI application"

    def add_arguments(self, parser):
        parser.add_argument(
            "--workers", type=int, default=1, help="Number of worker processes"
        )
        parser.add_argument(
            "--bind", type=str, default="0.0.0.0:8000", help="The socket to bind"
        )
        parser.add_argument(
            "--max-requests",
            type=int,
            default=1000,
            help="The maximum number of requests a worker will process before restarting",
        )
        parser.add_argument(
            "--timeout",
            type=int,
            default=30,
            help="Workers silent for more than this many seconds are killed and restarted",
        )

    def handle(self, *args, **options):
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

        class GunicornApplication(WSGIApplication):
            def load_config(self):
                self.cfg.set("workers", options["workers"])
                self.cfg.set("bind", options["bind"])
                self.cfg.set("max_requests", options["max_requests"])
                self.cfg.set("timeout", options["timeout"])

            def load(self):
                from flows.on_exit_handler.flows import on_exit_handler

                self.cfg.set("worker_int", on_exit_handler)

                from flows.bootstrap.flows import bootstrap

                bootstrap()

                return application

        GunicornApplication().run()
