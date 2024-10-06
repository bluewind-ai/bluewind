import logging
from typing import Type  # noqa: F401

from functions.bluewind_function.v1.functions import bluewind_function_v1
from functions.load_apollo_company_searches.v1.functions import (
    load_apollo_company_searches_v1,
)
from functions.select_or_create_apollo_company_searches.v1.functions import (
    select_or_create_apollo_company_searches_v1,
)

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


@bluewind_function_v1()
def load_companies_into_crm_v1(
    function_call,
    user,
):
    apollo_company_searches = select_or_create_apollo_company_searches_v1(
        function_call=function_call,
        user=user,
    )
    loaded_apollo_people_searches_v1 = load_apollo_company_searches_v1(
        function_call=function_call,
        user=user,
        apollo_company_searches=apollo_company_searches,
    )
    # loaded_domain_names = load_domain_names_v1(domain_names=domain_name)
    # raw_dns_records = scan_domain_name_v1(domain_names=loaded_domain_names)
    # store_dns_records_v1(dns_records_data=raw_dns_records, domain_names=domain_name)
