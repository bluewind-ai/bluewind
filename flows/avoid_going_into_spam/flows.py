import logging

# Patch standard library
logger = logging.getLogger("django.temp")  # noqa: F821


def avoid_going_into_spam(flow_run):
    """
    Helps you avoid going into spam when you send emails

    Args:
        flow_run (FlowRun): The current flow run object.

    Returns:
        None
    """
    pass
