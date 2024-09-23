#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""

import gevent.monkey  # noqa

gevent.monkey.patch_all()  # noqa

import logging.config
import os
import sys


def load_env():
    """Load environment variables from .env file."""
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "bluewind.settings_prod")

    env_file = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_file):
        with open(env_file, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    key, value = line.split("=", 1)
                    os.environ[key] = value.strip("'").strip('"')


def main():
    """Run administrative tasks."""
    load_env()
    from bluewind.logging_config import get_logging_config  # noqa

    logging.config.dictConfig(get_logging_config())

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "bluewind.settings_prod")

    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
        # try:
    execute_from_command_line(sys.argv)
    # except Exception:
    #     import logging

    #     logger = logging.getLogger("django.not_used")
    #     logger.exception("Error executing command.")


if __name__ == "__main__":
    try:
        main()
    except BaseException:
        logger = logging.getLogger("django.temp")
        logger.exception("Error executing command.")
