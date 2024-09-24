import logging

from django.core.management import BaseCommand
from gunicorn.app.base import BaseApplication

from get_application import get_application

# Set up logging
logger = logging.getLogger("django.temp")


class GeventGunicornApplication(BaseApplication):
    def __init__(self, options):
        self.options = options
        # self.application = app
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
        return get_application()


class Command(BaseCommand):
    help = "Runs Gunicorn with the project WSGI application using gevent"

    def handle(self, *args, **options):
        GeventGunicornApplication(
            {
                "bind": "0.0.0.0:8000",
                "worker_class": "gevent",
                "workers": 1,
                "worker_connections": 10000,
                "max_requests": 10000,
                "timeout": 30,
                "reload": True,
                "reload_engine": "auto",
                "reload_extra_files": ["/bluewind"],
            },
        ).run()
