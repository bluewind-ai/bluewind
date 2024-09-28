import logging

from forms.create_domain_name.v1.forms import CreateDomainNameV1
from functions.avoid_going_into_spam.v1.functions import avoid_going_into_spam_v1
from functions.bluewind_function.v1.functions import bluewind_function_v1

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


@bluewind_function_v1()
def master_v1(test=CreateDomainNameV1) -> CreateDomainNameV1:
    """
    Summary:

    """
    return avoid_going_into_spam_v1()
