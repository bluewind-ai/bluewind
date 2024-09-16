import logging

from files.models import File
from models.models import Model  # Import the Model class

logger = logging.getLogger("django.debug")


def file_changes_after_save(file_change):
    logger.debug(f"Starting file_changes_after_save for: {file_change.file.path}")
    # Check if is directory
    if file_change.file.path.endswith("models.py"):
        logger.debug(f"Detected change in models.py: {file_change.file.path}")

        # Fetch the File instance from the database
        try:
            file_instance = File.objects.get(path=file_change.file.path)
            content = file_instance.content

            # Update all Model instances with the new content
            Model.objects.update(
                content=content,
            )
            logger.debug("All Model instances updated with the content of models.py.")
        except File.DoesNotExist:
            logger.error(f"File not found in database: {file_change.file.path}")
    else:
        logger.debug(f"No action needed for file: {file_change.file.path}")
