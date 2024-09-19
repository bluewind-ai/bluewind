import asyncio
import importlib
import signal

from daphne.endpoints import build_endpoint_description_strings
from daphne.server import Server
from django.core.management.base import BaseCommand

from flows.on_exit_handler.flows import on_exit_handler


class Command(BaseCommand):
    help = "Runs Daphne server with custom shutdown hook"

    def handle(self, *args, **options):
        host = "127.0.0.1"
        port = 8000
        application_path = "bluewind.asgi:application"

        # Dynamically import the ASGI application
        module_path, object_name = application_path.split(":")
        module = importlib.import_module(module_path)
        application = getattr(module, object_name)

        endpoints = build_endpoint_description_strings(host=host, port=port)
        self.server = Server(
            application=application, endpoints=endpoints, signal_handlers=False
        )

        print(f"\nServer is running on http://{host}:{port}\n")

        signal.signal(signal.SIGINT, self.sigint_handler)

        try:
            self.server.run()
        except KeyboardInterrupt:
            pass

    def sigint_handler(self, signum, frame):
        print("\nCtrl+C detected. Calling exit handler...")
        asyncio.get_event_loop().call_soon(
            lambda: asyncio.create_task(on_exit_handler(self.server))
        )
