from django.core.management.base import BaseCommand

from flows.models import Flow
from flows.run_flow.flows import run_flow


class Command(BaseCommand):
    help = "Description of your command"

    def add_arguments(self, parser):
        pass
        # Add command line arguments if needed
        # parser.add_argument('argument_name', type=str, help='Description of the argument')

    def handle(self, *args, **options):
        # Your command logic goes here
        flow = Flow.objects.get(name="run_bluewind")
        run_flow(flow, flow.user, input_data={})
