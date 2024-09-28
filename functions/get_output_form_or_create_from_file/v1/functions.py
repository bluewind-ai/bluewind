import logging

from functions.get_form_or_create_from_file.v1.functions import (
    get_form_or_create_from_file_v1,
)

logger = logging.getLogger("django.not_used")


def get_output_form_or_create_from_file_v1(function):
    try:
        form_object = function.__annotations__.get("return")
        return get_form_or_create_from_file_v1(form_object)
    except:
        raise ValueError(function.__annotations__)
