import logging
from typing import Type  # noqa: F401

from functions.bluewind_function.v1.functions import bluewind_function_v1
from functions.create_domain_name.v1.functions import create_domain_name_v1

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


@bluewind_function_v1()
def select_or_create_domain_name_v1():
    # one_month_ago = timezone.now() - timezone.timedelta(days=30)

    # domain_names = DomainName.objects.filter(
    #     Q(last_scanned_at__lt=one_month_ago) | Q(last_scanned_at__isnull=True)
    # ).order_by("last_scanned_at")[:1]

    # if domain_names.exists():
    #     return domain_names
    name = create_domain_name_v1()
    return name
