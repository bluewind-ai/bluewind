from django.core.management.base import BaseCommand
from gunicorn import util
from gunicorn.app.base import BaseApplication


class CustomGunicornApplication(BaseApplication):
    def __init__(self):
        self.options = {
            "bind": "0.0.0.0:8000",
            "worker_class": "gevent",
            "workers": 1,
            "worker_connections": 10000,
            "max_requests": 10000,
            "timeout": 30,
            "reload": True,
            "reload_engine": "auto",
            "reload_extra_files": ["/bluewind"],
        }
        self.application = (
            "bluewind.wsgi:application"  # Changed from 'app' to 'application'
        )
        super().__init__()

    def load_config(self):
        for key, value in self.options.items():
            if key in self.cfg.settings and value is not None:
                self.cfg.set(key.lower(), value)

    def load(self):
        return util.import_app(self.application)


class Command(BaseCommand):
    help = "Runs Gunicorn with hardcoded configuration"

    def handle(self, *args, **options):
        CustomGunicornApplication().run()
