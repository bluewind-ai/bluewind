import logging
import os

from django.contrib.auth import get_user_model

from file_watchers.models import FileWatcher

User = get_user_model()
logger = logging.getLogger("django.debug")


def file_watchers_init():
    try:
        # Set the desired absolute pathcdscds
        target_path = os.environ["BASE_DIR"]
        # Fetch the first FileWatcher instance or create a new one if none exists
        file_watcher, created = FileWatcher.objects.get_or_create(
            name="Root File Watcher",  # Provide a unique name
            defaults={
                "path": target_path,
                "user": User.objects.first(),
                "workspace_id": 1,
            },
        )

        # Always update the file watcher path to the specified target path
        file_watcher.path = target_path
        file_watcher.save()

        if created:
            logger.info(f"Created a new FileWatcher: {file_watcher}")
        else:
            logger.info("Updated existing FileWatcher path.")

    except Exception as e:
        logger.error(f"Error in file watchers operation: {e}")
