import logging

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


def master(flow_run):
    pass
