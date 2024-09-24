from django.core.management.base import BaseCommand


class BluewindBaseCommand(BaseCommand):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # logging_config = get_logging_config()
        # logging.config.dictConfig(logging_config)

    def handle(self, *args, **options):
        raise NotImplementedError("Subclasses must implement handle()")
