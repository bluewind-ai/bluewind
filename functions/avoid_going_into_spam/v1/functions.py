import logging
from typing import Type  # noqa: F401

from functions.bluewind_function.v1.functions import bluewind_function_v1
from functions.create_domain_name.v1.functions import create_domain_name_v1
from functions.load_domain_names.v1.functions import load_domain_names_v1
from functions.scan_domain_name.v1.functions import (
    scan_domain_name_v1,
)

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


@bluewind_function_v1()
def avoid_going_into_spam_v1():
    domain_name = create_domain_name_v1()
    loaded_domain_names = load_domain_names_v1(domain_name=domain_name)
    raw_dns_records = scan_domain_name_v1(loaded_domain_names=loaded_domain_names)
