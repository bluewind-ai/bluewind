import importlib
import logging

from function_calls.models import FunctionCall

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


def snake_to_camel_case_uppercase(snake_str):
    components = snake_str.split("_")
    return "".join(x.capitalize() for x in components)


def approve_function_call_v1(function_call, user):
    func = import_function(function_call)
    function_call.status = FunctionCall.Status.RUNNING

    return func(
        function_call=function_call,
        user=user,
    )


def get_input_form(function_call):
    base_module = f"functions.{function_call.function.name_without_version}.v{function_call.function.version_number}"
    input_form_module = importlib.import_module(f"{base_module}.input_forms")
    form_name = snake_to_camel_case_uppercase(function_call.function.name) + "Form"
    input_form_class = getattr(input_form_module, form_name)

    if function_call.input_form_data is None:
        return input_form_class(data={})
    return input_form_class(data=function_call.input_form_data.data)


def get_filled_input_form(function_call):
    input_form = get_input_form(function_call)
    if input_form.is_valid():
        # If the form is valid, pass the cleaned data to the function
        return input_form
    else:
        raise ValueError(f"Form is invalid: {input_form.errors}")


def import_function(function_call):
    func_name = function_call.function.name
    base_module = f"functions.{function_call.function.name_without_version}.v{function_call.function.version_number}"
    function_module = importlib.import_module(f"{base_module}.functions")
    return getattr(function_module, func_name)
