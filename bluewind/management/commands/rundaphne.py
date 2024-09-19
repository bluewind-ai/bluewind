import asyncio
import importlib
import logging
import os
import signal

from daphne.endpoints import build_endpoint_description_strings
from daphne.server import Server
from django.core.management.base import BaseCommand

from flows.on_exit_handler.flows import on_exit_handler


class Command(BaseCommand):
    help = "Runs Daphne server with custom shutdown and reload hooks"

    def handle(self, *args, **options):
        self.host = "127.0.0.1"
        self.port = 8000
        self.application_path = "bluewind.asgi:application"

        self.setup_server()

        signal.signal(signal.SIGINT, self.sigint_handler)
        signal.signal(signal.SIGHUP, self.sighup_handler)

        print(f"\nServer is running on http://{self.host}:{self.port}")
        print(f"PID: {os.getpid()}\n")

        try:
            self.server.run()
        except KeyboardInterrupt:
            pass

    def setup_server(self):
        module_path, object_name = self.application_path.split(":")
        module = importlib.import_module(module_path)
        application = getattr(module, object_name)

        endpoints = build_endpoint_description_strings(host=self.host, port=self.port)
        self.server = Server(
            application=application, endpoints=endpoints, signal_handlers=False
        )

    def sigint_handler(self, signum, frame):
        print("\nCtrl+C detected. Calling exit handler...")
        asyncio.get_event_loop().call_soon(
            lambda: asyncio.create_task(on_exit_handler(self.server))
        )

    def sighup_handler(self, signum, frame):
        print("\nSIGHUP detected. Reloading server...")
        asyncio.get_event_loop().call_soon(
            lambda: asyncio.create_task(self.reload_server())
        )

    async def reload_server(self):
        await on_exit_handler(self.server)
        self.setup_server()
        print(f"\nServer reloaded and running on http://{self.host}:{self.port}")
        print(f"PID: {os.getpid()}\n")
        self.server.run()


# If you want to include the reload_daphne function in the same file:

logger = logging.getLogger("django.temp")


def reload_daphne(daphne_process):
    pid = daphne_process.master_pid
    logger.debug(f"Sending reload signal to Daphne process (PID: {pid})")
    os.kill(pid, signal.SIGHUP)
    return {"message": f"Sent reload signal to Daphne process (PID: {pid})"}
