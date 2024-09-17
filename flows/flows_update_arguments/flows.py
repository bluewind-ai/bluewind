import logging

from flows.get_function_parameters.flows import get_function_parameters
from flows.models_update_after_file_changes.flows import flows_update_arguments

logger = logging.getLogger("django.debug")


def flows_update_arguments(file_change):
    parameters = get_function_parameters(file_change)

    # put the function here
