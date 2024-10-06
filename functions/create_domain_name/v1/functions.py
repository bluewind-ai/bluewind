import logging

from domain_names.models import DomainName
from functions.bluewind_function.v1.functions import bluewind_function_v1

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


@bluewind_function_v1()
def create_domain_name_v1(function_call, user) -> DomainName:
    return {}
