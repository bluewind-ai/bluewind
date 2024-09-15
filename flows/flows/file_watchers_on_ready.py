from venv import logger

from file_watchers.models import FileWatcher


def file_watchers_on_ready():
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
