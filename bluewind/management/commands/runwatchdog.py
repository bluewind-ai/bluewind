from django.core.management.base import BaseCommand

from flows.file_watchers_init.flows import file_watchers_init


class Command(BaseCommand):
    help = "Runs a custom function"

    def handle(self, *args, **options):
        file_watchers_init()
