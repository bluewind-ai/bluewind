import logging
from typing import Type  # noqa: F401

from credentials.models import Credential
from functions.bluewind_function.v1.functions import bluewind_function_v1
from functions.create_apollo_company_searches.v1.functions import (
    create_apollo_company_searches_v1,
)

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


@bluewind_function_v1()
def select_or_create_apollo_api_keys_v1(
    function_call,
    user,
):
    apollo_company_searches = Credential.objects.all()[:1]

    if apollo_company_searches.exists():
        return apollo_company_searches
    apollo_api_key = create_apollo_company_searches_v1(
        function_call=function_call,
        user=user,
    )
    return apollo_api_key
