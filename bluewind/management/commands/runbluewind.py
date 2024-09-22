from django.core.management.base import BaseCommand

from flows.run_bluewind.flows import run_bluewind


class Command(BaseCommand):
    help = "Description of your command"

    def add_arguments(self, parser):
        pass
        # Add command line arguments if needed
        # parser.add_argument('argument_name', type=str, help='Description of the argument')

    def handle(self, *args, **options):
        # Your command logic goes here
        run_bluewind()
