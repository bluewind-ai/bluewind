import logging
from typing import Any, Dict, List

import requests

from functions.bluewind_function.v1.functions import bluewind_function_v1

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821

APOLLO_API_URL = "https://api.apollo.io/api/v1/mixed_companies/search"


@bluewind_function_v1(is_making_network_calls=True)
def query_apollo_company_searches_v1(
    function_call: Dict[str, Any],
    user: Dict[str, Any],
    apollo_company_searches: List[Dict[str, Any]],
    apollo_api_key: Dict[str, Any],
) -> Dict[str, Any]:
    # Assume the API key is stored in the user object
    api_key = user.get("apollo_api_key")

    if not api_key:
        return {"error": "Apollo API key not found"}

    headers = {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Api-Key": api_key,
    }

    # Extract the organization_num_employees_ranges from the first search
    if (
        apollo_company_searches
        and "organization_num_employees_ranges" in apollo_company_searches[0]
    ):
        ranges = apollo_company_searches[0]["organization_num_employees_ranges"]

        # Construct the query
        query = {
            "organization_num_employees_ranges": ranges,
            "page": 1,
            "per_page": 10,  # You can adjust this as needed
        }

        try:
            response = requests.post(APOLLO_API_URL, headers=headers, json=query)
            response.raise_for_status()  # Raises an HTTPError for bad responses
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"error": f"API request failed: {str(e)}"}
    else:
        return {"error": "No valid organization_num_employees_ranges provided"}
