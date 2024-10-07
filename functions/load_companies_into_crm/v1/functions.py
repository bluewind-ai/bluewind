import logging
from typing import Type  # noqa: F401

from functions.bluewind_function.v1.functions import bluewind_function_v1
from functions.load_apollo_company_searches.v1.functions import (
    load_apollo_company_searches_v1,
)
from functions.query_apollo_company_searches.v1.functions import (
    query_apollo_company_searches_v1,
)
from functions.select_or_create_apollo_api_keys.v1.functions import (
    select_or_create_apollo_api_keys_v1,
)
from functions.select_or_create_apollo_company_searches.v1.functions import (
    select_or_create_apollo_company_searches_v1,
)
from functions.store_companies.v1.functions import store_companies_v1

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

    apollo_api_key = select_or_create_apollo_api_keys_v1(
        function_call=function_call, user=user
    )

    raw_apollo_companies = query_apollo_company_searches_v1(
        function_call=function_call,
        user=user,
        apollo_company_searches=loaded_apollo_people_searches_v1,
        apollo_api_key=apollo_api_key,
    )

    store_companies_v1(
        function_call=function_call,
        user=user,
        raw_apollo_companies=raw_apollo_companies,
    )
