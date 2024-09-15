import logging

from models.models import Model  # Import the Model class

logger = logging.getLogger("django.debug")


def file_changes_after_save(file_changes):
    logger.debug(f"Starting file_changes_after_save for: {file_changes.file_path}")

    if file_changes.file_path.endswith("models.py"):
        logger.debug(f"Detected change in models.py: {file_changes.file_path}")

        # Read the content from the changed models.py file
        with open(file_changes.file_path, "r") as file:
            content = file.read()

        # Update all Model instances with the new content
        Model.objects.update(content=content)
        logger.debug("All Model instances updated with the content of models.py.")
    else:
        logger.debug(f"No action needed for file: {file_changes.file_path}")
