import logging

from functions.bluewind_function.v1.functions import bluewind_function_v1
from functions.get_superuser_or_bootstrap.v1.functions import (
    get_superuser_or_bootstrap_v1,
)

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


@bluewind_function_v1()
def master_v1():
    """
    Summary:

    """
    get_superuser_or_bootstrap_v1()
