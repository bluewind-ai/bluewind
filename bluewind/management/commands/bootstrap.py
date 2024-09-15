from django.core.management.base import BaseCommand

from flows.flows.bootstrap import bootstrap


class Command(BaseCommand):
    help = "Runs the bootstrap function to load files and initialize file watchers"

    def handle(self, *args, **options):
        self.stdout.write("Starting bootstrap process...")

        self.stdout.write("Loading all files...")
        bootstrap()

        self.stdout.write("Initializing file watchers...")

        self.stdout.write(
            self.style.SUCCESS("Bootstrap process completed successfully.")
        )
