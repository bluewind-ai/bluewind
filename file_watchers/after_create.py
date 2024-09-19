import logging

from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

from file_changes.models import FileChange
from flows.is_ignored_by_git.flows import is_ignored_by_git

logger = logging.getLogger("django.temp")
observers_registry = {}


class SimpleFileChangeHandler(FileSystemEventHandler):
    def __init__(self, file_watcher):
        super().__init__()
        self.file_watcher = file_watcher
        logger.error(f"Initialized SimpleFileChangeHandler for {file_watcher.name}")

    def _create_file_change(self, event, change_type):
        logger.info(f"Processing {change_type} event for {event.src_path}")
        if not is_ignored_by_git(event.src_path):
            FileChange.objects.create(
                file_watcher=self.file_watcher,
                source_path=event.src_path,
                change_type=change_type,
                user_id=self.file_watcher.user_id,
                workspace=self.file_watcher.workspace,
            )
            logger.error(f"FileChange ({change_type}) created for {event.src_path}")
        else:
            logger.info(f"Ignoring git-ignored file: {event.src_path}")

    def on_created(self, event):
        logger.debug(f"File created event detected: {event.src_path}")
        self._create_file_change(event, "created")

    def on_modified(self, event):
        logger.debug(f"File modified event detected: {event.src_path}")
        self._create_file_change(event, "modified")

    def on_deleted(self, event):
        logger.debug(f"File deleted event detected: {event.src_path}")
        self._create_file_change(event, "deleted")


def file_watchers_after_create(file_watcher):
    logger.info(
        f"Processing file_watcher: {file_watcher.name}, is_active: {file_watcher.is_active}"
    )
    if file_watcher.is_active and file_watcher.name not in observers_registry:
        # Start watching this path
        logger.info(f"Starting to watch path: {file_watcher.path}")
        event_handler = SimpleFileChangeHandler(file_watcher)
        observer = Observer()
        observer.schedule(event_handler, path=file_watcher.path, recursive=True)
        observer.start()
        observers_registry[file_watcher.name] = observer
        logger.info(f"Successfully started watching: {file_watcher.path}")
    elif not file_watcher.is_active and file_watcher.name in observers_registry:
        # Stop watching this path
        logger.info(f"Stopping watch for path: {file_watcher.path}")
        observer = observers_registry.pop(file_watcher.name)
        observer.stop()
        observer.join()
        logger.info(f"Successfully stopped watching: {file_watcher.path}")
    else:
        logger.info(f"No action taken for file_watcher: {file_watcher.name}")
