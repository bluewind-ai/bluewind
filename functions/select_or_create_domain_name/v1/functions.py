import logging
from typing import Type  # noqa: F401

from domain_names.models import DomainName
from functions.bluewind_function.v1.functions import bluewind_function_v1
from functions.create_domain_name.v1.functions import create_domain_name_v1
from functions.select_domain_names.v1.functions import select_domain_names_v1

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


@bluewind_function_v1()
def select_or_create_domain_name_v1():
    if DomainName.objects.all():
        return select_domain_names_v1()
    name = create_domain_name_v1()
    return name
