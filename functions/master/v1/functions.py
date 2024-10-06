import logging

from functions.avoid_going_into_spam.v1.functions import avoid_going_into_spam_v1
from functions.bootstrap.v1.functions import bootstrap_v1
from functions.load_companies_into_crm.v1.functions import load_companies_into_crm_v1

# Patch standard library
logger = logging.getLogger("django.not_used")


def master_v1():
    """
    Summary:
    This view runs the master_v1 function atomically and returns an HTTP response.
    """

    function_call, user = bootstrap_v1()
    load_companies_into_crm_v1(
        function_call=function_call,
        user=user,
    )

    avoid_going_into_spam_v1(
        function_call=function_call,
        user=user,
    )
    return function_call, user
