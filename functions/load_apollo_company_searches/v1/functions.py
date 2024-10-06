import logging
from typing import Type  # noqa: F401

from functions.bluewind_function.v1.functions import bluewind_function_v1

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


@bluewind_function_v1()
def load_apollo_company_searches_v1(function_call, user, apollo_company_searches):
    return [
        {
            "organization_num_employees_ranges": apollo_company_search.organization_num_employees_ranges
        }
        for apollo_company_search in apollo_company_searches
    ]
