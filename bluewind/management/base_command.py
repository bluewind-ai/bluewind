import logging.config

from django.core.management.base import BaseCommand

from bluewind.logging_config import get_logging_config


class BluewindBaseCommand(BaseCommand):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        logging_config = get_logging_config()
        logging.config.dictConfig(logging_config)

    def handle(self, *args, **options):
        raise NotImplementedError("Subclasses must implement handle()")
