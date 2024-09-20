import logging

from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

from file_system_changes.models import FileSystemChange
from flows.is_ignored_by_git.flows import is_ignored_by_git

logger = logging.getLogger("django.temp")
observers_registry = {}


class SimpleFileChangeHandler(FileSystemEventHandler):
    def __init__(self, file_watcher):
        super().__init__()
        self.file_watcher = file_watcher
        logger.debug(f"Initialized SimpleFileChangeHandler for {file_watcher.path}")

    def _create_file_system_change(self, event, change_type):
        try:
            logger.debug(f"Processing {change_type} event for {event.src_path}")
            if not is_ignored_by_git(event.src_path):
                FileSystemChange.objects.create(
                    file_watcher=self.file_watcher,
                    source_path=event.src_path,
                    destination_path=event.dest_path
                    if change_type == "moved"
                    else None,
                    change_type=change_type,
                    user_id=self.file_watcher.user_id,
                    workspace=self.file_watcher.workspace,
                )
                logger.debug(f"FileChange ({change_type}) created for {event.src_path}")
            else:
                logger.debug(f"Ignoring git-ignored file: {event.src_path}")
        except Exception:
            logger.exception(f"Error processing event of type {change_type}")

    def on_moved(self, event):
        logger.debug(
            f"File/directory moved event detected: {event.src_path} -> {event.dest_path}"
        )
        self._create_file_system_change(event, "moved")

    def on_created(self, event):
        logger.debug(f"File created event detected: {event.src_path}")
        self._create_file_system_change(event, "created")

    def on_modified(self, event):
        logger.debug(f"File modified event detected: {event.src_path}")
        try:
            self._create_file_system_change(event, "created")
        except Exception:
            logger.exception("Error processing file creation event")
        # self._create_file_system_change(event, "modified")

    def on_deleted(self, event):
        logger.debug(f"File deleted event detected: {event.src_path}")
        self._create_file_system_change(event, "deleted")


def file_watchers_after_create(file_watcher):
    try:
        logger.debug(
            f"Processing file_watcher: {file_watcher.path}, is_active: {file_watcher.is_active}"
        )
        if file_watcher.is_active and file_watcher.path not in observers_registry:
            # Start watching this path
            logger.debug(f"Starting to watch path: {file_watcher.path}")
            event_handler = SimpleFileChangeHandler(file_watcher)
            observer = Observer()
            observer.schedule(event_handler, path=file_watcher.path, recursive=True)
            observer.start()
            observers_registry[file_watcher.path] = observer
            logger.debug(f"Successfully started watching: {file_watcher.path}")
        elif not file_watcher.is_active and file_watcher.path in observers_registry:
            # Stop watching this path
            logger.debug(f"Stopping watch for path: {file_watcher.path}")
            observer = observers_registry.pop(file_watcher.path)
            observer.stop()
            observer.join()
            logger.debug(f"Successfully stopped watching: {file_watcher.path}")
        else:
            logger.debug(f"No action taken for file_watcher: {file_watcher.path}")
    except Exception:  # noqa One of the very few exceptions because this runs in a separate thread and the logs look ugly if I don't do that.
        logger.exception(f"Error in file_watcher: {file_watcher.path}")
