import logging

from flows.flows.models_update_after_file_changes import (
    models_update_after_file_changes,
)

logger = logging.getLogger("django.debug")


def file_changes_after_save(file_change):
    models_update_after_file_changes(file_change)
    flows_update_after_file_changes(file_change)
