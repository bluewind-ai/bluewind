import logging

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


def avoid_going_into_spam(function_call):
    pass
