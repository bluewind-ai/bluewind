import logging
from typing import Type  # noqa: F401

from functions.bluewind_function.v1.functions import bluewind_function_v1

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


@bluewind_function_v1()
def store_dns_records_v1(raw_dns_records):
    pass
