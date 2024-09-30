import logging
from typing import Type  # noqa: F401

from domain_names.models import DomainName
from functions.bluewind_function.v1.functions import bluewind_function_v1

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


@bluewind_function_v1()
def select_or_create_domain_name_v1():
    if DomainName.objects.all():
        raise_debug("cndsjkcds")
    raise_debug("cndsjkcds")
