from bluewind.management.base_command import BluewindBaseCommand
from flows.file_watchers_init.flows import file_watchers_init


class Command(BluewindBaseCommand):
    help = "Runs a custom function"

    def handle(self, *args, **options):
        file_watchers_init()
