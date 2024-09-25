import logging

# Patch standard library
logger = logging.getLogger("django.temp")  # noqa: F821


def scan_domain_name_for_dkim(flow_run):
    """
    I am going to check if you have implemented best practices to avoid going into spam, ok?

    Args:
        flow_run (FlowRun): The current flow run object.

    Returns:
        None
    """

    scan_domain_name_for_dkim()
