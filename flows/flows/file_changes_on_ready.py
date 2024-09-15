import logging

from file_watchers.models import FileWatcher

logger = logging.getLogger("django.not_used")


def file_changes_post_migrate():
    try:
        # Fetch the first FileWatcher instance
        file_watcher = FileWatcher.objects.first()
        if file_watcher:
            logger.debug(f"Resaving the first FileWatcher: {file_watcher}")
            file_watcher.save()  # Resave the first FileWatcher
            logger.info("Successfully resaved the first FileWatcher.")
        else:
            logger.info("No FileWatcher instances found to resave.")
    except Exception as e:
        logger.error(f"Error resaving the first FileWatcher: {e}")
