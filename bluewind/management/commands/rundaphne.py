import asyncio
import signal

from daphne.endpoints import build_endpoint_description_strings
from daphne.server import Server
from django.core.management.base import BaseCommand

from flows.on_exit_handler.flows import on_exit_handler


class Command(BaseCommand):
    help = "Runs Daphne server with custom shutdown hook"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.server = None

    def handle(self, *args, **options):
        host = "0.0.0.0"
        port = 8000
        application = "bluewind.asgi:application"

        endpoints = build_endpoint_description_strings(host=host, port=port)
        self.server = Server(
            application=application,
            endpoints=endpoints,
            signal_handlers=False,  # We'll handle signals ourselves
        )

        print(f"\nServer is running on http://{host}:{port}\n")

        # Set up custom signal handler
        signal.signal(signal.SIGINT, self.sigint_handler)

        try:
            self.server.run()
        except KeyboardInterrupt:
            pass

    def sigint_handler(self, signum, frame):
        print("\nCtrl+C detected. Calling exit handler...")
        # Schedule the on_exit_handler to run in the next iteration of the event loop
        asyncio.get_event_loop().call_soon(self.run_exit_handler)

    def run_exit_handler(self):
        asyncio.create_task(on_exit_handler(self.server))
        # Stop the server after a short delay to allow the exit handler to complete
        asyncio.get_event_loop().call_later(1, self.server.stop)


if __name__ == "__main__":
    Command().execute()
