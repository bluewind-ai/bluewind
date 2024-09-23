from bluewind.management.base_command import BluewindBaseCommand
from flows.models import Flow
from flows.run_flow.flows import run_flow


class Command(BluewindBaseCommand):
    help = "Description of your command"

    def add_arguments(self, parser):
        pass
        # Add command line arguments if needed
        # parser.add_argument('argument_name', type=str, help='Description of the argument')

    def handle(self, *args, **options):
        # Your command logic goes here
        # from bluewind.logging_config import get_logging_config  # noqa

        # logging.config.dictConfig(get_logging_config())
        # logger = logging.getLogger("django.temp")

        # logger.debug("cdsnjkcdsbnhjcbdshjbchdjsbchjdsbjh")

        flow = Flow.objects.get(name="run_bluewind")

        run_flow(flow, flow.user, input_data={})
