import logging

from django.shortcuts import redirect

from functions.get_superuser_or_bootstrap.v1.functions import (
    get_superuser_or_bootstrap_v1,
)

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


def master_v1(request):
    """
    Summary:

    """
    superuser = get_superuser_or_bootstrap_v1()

    if not request.path.startswith("/workspaces/1/admin/function_calls/functioncall"):
        # raise_debug(request.path)
        return redirect("/workspaces/1/admin/function_calls/functioncall/1/change/")
    raise_debug("c djnsk")
