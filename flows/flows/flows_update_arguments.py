import logging

from flows.flows.get_function_parameters import get_function_parameters
from flows.flows.models_update_after_file_changes import flows_update_arguments

logger = logging.getLogger("django.debug")


def flows_update_arguments(file_change):
    parameters = get_function_parameters(file_change)

    pass
