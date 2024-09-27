import importlib
import logging

from bluewind.context_variables import set_approved_function_call
from function_calls.models import FunctionCall
from functions.bluewind_function.v1.functions import bluewind_function_v1

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


def snake_to_camel_case_uppercase(snake_str):
    components = snake_str.split("_")
    return "".join(x.capitalize() for x in components)


@bluewind_function_v1()
def handle_query_params_v1(query_params, function_call_id):
    function_name = query_params.get("function")
    if function_name == "approve_function_call":
        function_call = FunctionCall.objects.get(id=function_call_id)

        function_call.status = FunctionCall.Status.APPROVED
        function_call.save()
        # Assume the function is in the current module if no module is specified
        func = get_function(function_call)
        set_approved_function_call(function_call)

        # Create an instance of the input form with the initial data
        input_form = get_filled_input_form(function_call)
        return func(**input_form.cleaned_data)
    # Handle other cases if needed
    return None


def get_input_form(function_call):
    base_module = f"functions.{function_call.function.name_without_version}.v{function_call.function.version_number}"
    input_form_module = importlib.import_module(f"{base_module}.input_forms")
    form_name = snake_to_camel_case_uppercase(function_call.function.name) + "Form"
    input_form_class = getattr(input_form_module, form_name)

    # Create an instance of the input form with the initial data
    return input_form_class(data=function_call.input_data)


def get_filled_input_form(function_call):
    input_form = get_input_form(function_call)
    if input_form.is_valid():
        # If the form is valid, pass the cleaned data to the function
        return input_form
    else:
        raise ValueError(f"Form is invalid: {input_form.errors}")


def get_function(function_call):
    func_name = function_call.function.name
    base_module = f"functions.{function_call.function.name_without_version}.v{function_call.function.version_number}"
    function_module = importlib.import_module(f"{base_module}.functions")
    return getattr(function_module, func_name)
