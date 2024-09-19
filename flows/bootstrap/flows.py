import logging

from flows.run_linters.flows import run_linters

logger = logging.getLogger("django.debug")


def bootstrap():
    bootstrap_workspace()
    bootstrap_gunicorn_instance()
    run_linters()
