import logging
import os

from files.models import File
from flows.flows.is_ignored_by_git import is_ignored_by_git

logger = logging.getLogger("django.not_used")


def files_load_all():
    logger.debug("Starting to process Python files...")

    base_dir = os.environ.get(
        "BASE_DIR", "."
    )  # Get base directory from environment or use the current directory
    default_user_id = 1  # Default user ID
    default_workspace_id = 1  # Default workspace ID

    try:
        for root, dirs, files in os.walk(base_dir):
            for file_name in files:
                if file_name.endswith(".py"):  # Only process Python files
                    file_path = os.path.join(root, file_name)

                    # Check if the file is ignored by Git
                    if not is_ignored_by_git(file_path):
                        try:
                            with open(file_path, "r") as file:
                                content = file.read()

                            # Create or update the FileModel instance with default user_id and workspace_id
                            File.objects.update_or_create(
                                path=file_path,
                                defaults={
                                    "content": content,
                                    "user_id": default_user_id,
                                    "workspace_id": default_workspace_id,
                                },
                            )
                            logger.debug(
                                f"Python file '{file_path}' added to the database."
                            )
                        except Exception as e:
                            logger.error(f"Error processing file '{file_path}': {e}")
    except Exception as e:
        logger.error(f"Unexpected error occurred: {e}")

    logger.debug("Finished processing Python files.")
