import logging

from domain_names.models import DomainName
from functions.bluewind_function.v1.functions import bluewind_function_v1

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


@bluewind_function_v1(redirect="domain_names")
def select_domain_names_v1() -> DomainName:
    return {}
