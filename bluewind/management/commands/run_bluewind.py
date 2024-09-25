import logging
import os

from django.core.wsgi import get_wsgi_application
from gunicorn.app.base import BaseApplication

from bluewind.context_variables import set_startup_mode, set_workspace_id
from bluewind.management.base_command import BluewindBaseCommand

# Set up logging
logger = logging.getLogger("django.not_used")


class GeventGunicornApplication(BaseApplication):
    def __init__(self, app, options=None):
        self.options = options or {}
        self.application = app
        super().__init__()

    def load_config(self):
        config = {
            key: value
            for key, value in self.options.items()
            if key in self.cfg.settings and value is not None
        }
        for key, value in config.items():
            self.cfg.set(key.lower(), value)

    def load(self):
        return self.application

    def reload(self):
        logger.info("Detected change. Reloading...")
        return super().reload()


class Command(BluewindBaseCommand):
    help = "Runs Gunicorn with the project WSGI application using gevent"

    def add_arguments(self, parser):
        parser.add_argument("--workers", type=int, default=1)
        parser.add_argument("--bind", type=str, default="0.0.0.0:8000")
        parser.add_argument("--max-requests", type=int, default=1000)
        parser.add_argument("--timeout", type=int, default=30)
        parser.add_argument("--log-level", type=str, default="debug")

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

        django_application = get_wsgi_application()
        set_workspace_id(1)
        set_startup_mode(False)
        application = workspace_wsgi_middleware(django_application)

        # Configure logging
        # subprocess.run(["python", "manage.py", "run_watchdog"])
        # subprocess.run(["sh", "wipe_db.sh"])
        # logging.config.dictConfig(get_logging_config())
        # bootstrap()

        def on_starting(server):
            logger.info("Gunicorn is starting up...")
            print(
                "========== Gunicorn is reloading =========="
            )  # This will print to stdout

        def on_reload(server):
            logger.info("Gunicorn is reloacdscdscdsding...")
            # logging.config.dictConfig(logging_config())

        def post_worker_init(worker):
            logger.info(f"Gunicorn worker initialized (pid: {worker.pid})")

        # Get the current working directory
        current_dir = "/bluewind"
        logger.info(f"Current working directory: {current_dir}")
        logger.info(f"Files in current directory: {os.listdir(current_dir)}")

        gunicorn_options = {
            "bind": options["bind"],
            "worker_class": "gevent",
            "workers": 1,
            "worker_connections": 10000,
            "max_requests": 10000,
            "timeout": options["timeout"],
            "reload": True,
            "reload_engine": "auto",
            "on_starting": on_starting,
            "on_reload": on_reload,
            "post_worker_init": post_worker_init,
            # "logconfig_dict": get_logging_config(),
        }
        "cdscds"
        "cdscdscs"

        logger.info("Starting Gunicorn with gevent workers and hot reloading")

        for key, value in gunicorn_options.items():
            logger.debug(f"Gunicorn option: {key} = {value}")

        try:
            GeventGunicornApplication(application, gunicorn_options).run()
        except Exception as e:
            logger.error(f"An error occurred: {str(e)}", exc_info=True)
            raise
        self.stdout.write(self.style.SUCCESS("Gunicorn server stopped"))
