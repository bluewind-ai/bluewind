import inspect
import logging

from functions.get_form_or_create_from_file.v1.functions import (
    get_form_or_create_from_file_v1,
)

logger = logging.getLogger("django.not_used")
from typing import get_type_hints


def get_input_form_or_create_from_file_v1(function):
    try:
        function_parameters = inspect.signature(function).parameters
        if not function_parameters:
            return None
        key, value = next(iter(function_parameters.items()))

        # Extract the class from the Parameter object
        form_object = value.default

        return get_form_or_create_from_file_v1(form_object)
    except:
        raise ValueError(
            function, get_type_hints(function), inspect.signature(function).parameters
        )
