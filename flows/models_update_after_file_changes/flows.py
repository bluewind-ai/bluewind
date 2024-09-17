import logging

from files.models import File

logger = logging.getLogger("django.debug")
"cdscds"


def flows_update_arguments(file_change):
    logger.debug(f"Starting file_changes_after_save for: {file_change.file.path}")
    # Check if is directory
    if "flows/flows/" in file_change.file.path:
        logger.debug(f"Detected flow change: {file_change.file.path}")
        # Fetch the File instance from the database
        file_instance = File.objects.get(path=file_change.file.path)
        content = file_instance.content
        # TODO Update flow arguments
        # Update all Model instances with the new content
        logger.debug("All Flows instances updated")
    else:
        logger.debug(f"No action needed for file: {file_change.file.path}")
