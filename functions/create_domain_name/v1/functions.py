import logging

from functions.bluewind_function.v1.functions import bluewind_function_v1
from functions.create_domain_name.v1.input_forms import DomainNameFormV1

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


@bluewind_function_v1()
def create_domain_name_v1() -> DomainNameFormV1:
    pass
