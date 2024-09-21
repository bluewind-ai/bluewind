import logging
import os

from flows.directory_system_changes.flows import directory_system_changes
from flows.handle_file_change.flows import handle_file_change

logger = logging.getLogger("django.not_used")


def file_system_changes_after_create(file_system_change):
    logger.debug(
        f"FileChange ({file_system_change.change_type}) detected for {file_system_change.source_path}"
    )

    if os.path.isdir(file_system_change.source_path):
        return directory_system_changes(file_system_change)
    return handle_file_change(file_system_change)
