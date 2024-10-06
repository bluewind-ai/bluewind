import logging
from typing import Type  # noqa: F401

from apollo_company_searches.models import ApolloCompanySearch
from functions.bluewind_function.v1.functions import bluewind_function_v1
from functions.create_apollo_company_searches.v1.functions import (
    create_apollo_company_searches_v1,
)

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


@bluewind_function_v1()
def select_or_create_apollo_company_searches_v1(
    function_call,
    user,
):
    # one_month_ago = timezone.now() - timezone.timedelta(days=30)

    apollo_company_searches = ApolloCompanySearch.objects.all()[:1]

    if apollo_company_searches.exists():
        return apollo_company_searches
    name = create_apollo_company_searches_v1(
        function_call=function_call,
        user=user,
    )
    return name
