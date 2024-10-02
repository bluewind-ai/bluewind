import logging

from functions.models import Function

logger = logging.getLogger("django.not_used")


def get_function_or_create_from_file_v1(function_name):
    function = Function.objects.filter(name=function_name).first()
    if function:
        return function

    from functions.create_function_from_file.v1.functions import (
        create_function_from_file_v1,
    )

    return create_function_from_file_v1(function_name=function_name)
