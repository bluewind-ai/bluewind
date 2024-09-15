import logging
import os

from django.contrib.auth import get_user_model

from file_watchers.models import FileWatcher

User = get_user_model()
logger = logging.getLogger("django.temp")


def file_watchers_on_ready():
    try:
        # Fetch the first FileWatcher instance
        file_watcher = FileWatcher.objects.first()
        root_path = os.path.abspath(os.sep)

        if file_watcher:
            logger.debug(f"FileWatcher instance already exists: {file_watcher}")
            file_watcher.path = os.path.abspath(root_path)
            file_watcher.save()
            logger.info("Updated FileWatcher path.")
        else:
            # Get the absolute path to the root directory

            # Fetch the first available user (or a specific user if preferred)
            user = User.objects.first()

            if not user:
                logger.error("No user available to associate with FileWatcher.")
                return

            # Create a new FileWatcher instance if none exists
            logger.info("No FileWatcher instances found. Creating a new one.")
            file_watcher = FileWatcher.objects.create(
                name="Root File Watcher",  # Provide a unique name
                path=root_path,  # Set the path to the absolute root path
                user=user,  # Associate with a valid user
            )
            logger.info(f"Successfully created a new FileWatcher: {file_watcher}")
    except Exception as e:
        logger.error(f"Error in file watchers operation: {e}")
