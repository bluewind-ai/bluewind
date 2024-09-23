import logging
import subprocess  # noqa

from django.core.wsgi import get_wsgi_application
from gunicorn.app.base import BaseApplication

from bluewind.context_variables import set_startup_mode, set_workspace_id
from bluewind.management.base_command import BluewindBaseCommand
from flows.bootstrap.flows import bootstrap

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("django.gunicorn")


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


class Command(BluewindBaseCommand):
    help = "Runs Gunicorn with the project WSGI application using gevent"

    def add_arguments(self, parser):
        parser.add_argument("--workers", type=int, default=1)
        parser.add_argument("--bind", type=str, default="127.0.0.1:8000")
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
        from django.conf import settings
        from django.utils.module_loading import import_string

        logging_config_func = import_string(settings.LOGGING_CONFIG)
        logging_config = logging_config_func()

        # Configure logging
        import logging.config

        logging.config.dictConfig(logging_config)
        subprocess.run(["sh", "wipe_db.sh"])

        bootstrap()

        gunicorn_options = {
            "bind": options["bind"],
            "worker_class": "gevent",
            "workers": 1,
            "worker_connections": 10000,
            "max_requests": 10000,
            "timeout": options["timeout"],
            # "logconfig_dict": logging_config,
            # "loglevel": options["log_level"],
            # "logger_class": Logger,
            # "accesslog": "-",
            # "errorlog": "-",
            # "preload_app": True,
            # "gevent_pool": pool.Pool(10000),
        }

        logger.info("Starting Gunicorn with gevent workers")
        for key, value in gunicorn_options.items():
            logger.debug(f"Gunicorn option: {key} = {value}")

        GeventGunicornApplication(application, gunicorn_options).run()

        self.stdout.write(self.style.SUCCESS("Gunicorn server stopped"))
