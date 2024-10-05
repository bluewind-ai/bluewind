import logging
from typing import Type  # noqa: F401

from functions.bluewind_function.v1.functions import bluewind_function_v1
from functions.load_domain_names.v1.functions import load_domain_names_v1
from functions.scan_domain_name.v1.functions import (
    scan_domain_name_v1,
)
from functions.select_or_create_domain_name.v1.functions import (
    select_or_create_domain_name_v1,
)
from functions.store_dns_records.v1.functions import store_dns_records_v1

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


@bluewind_function_v1()
def avoid_going_into_spam_v1():
    domain_name = select_or_create_domain_name_v1()
    loaded_domain_names = load_domain_names_v1(domain_names=domain_name)
    raw_dns_records = scan_domain_name_v1(domain_names=loaded_domain_names)
    store_dns_records_v1(dns_records_data=raw_dns_records, domain_names=domain_name)
