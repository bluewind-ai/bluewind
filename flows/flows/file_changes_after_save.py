import logging

from flows.flows.models_update_after_file_changes import flows_update_arguments

logger = logging.getLogger("django.debug")


def file_changes_after_save(file_change):
    flows_update_arguments(file_change)
