import logging
from typing import Type  # noqa: F401

from django.db import transaction
from django.utils import timezone

from functions.bluewind_function.v1.functions import bluewind_function_v1

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


@bluewind_function_v1()
def mark_domain_name_as_scanned_v1(function_call, user, domain_names):
    with transaction.atomic():
        domain_names.update(last_scanned_at=timezone.now())
