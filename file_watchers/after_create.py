import logging

from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

from file_changes.models import FileChange
from flows.is_ignored_by_git.flows import is_ignored_by_git

logger = logging.getLogger("django.debug")
observers_registry = {}


class SimpleFileChangeHandler(FileSystemEventHandler):
    def __init__(self, file_watcher):
        super().__init__()
        self.file_watcher = file_watcher

    def _create_file_change(self, event, change_type):
        if not is_ignored_by_git(event.src_path):
            FileChange.objects.create(
                file_watcher=self.file_watcher,
                source_path=event.src_path,
                change_type=change_type,
                user_id=self.file_watcher.user_id,
                workspace=self.file_watcher.workspace,
            )
            logger.debug(f"FileChange ({change_type}) created for {event.src_path}")
        else:
            logger.debug(f"Ignoring git-ignored file: {event.src_path}")

    def on_created(self, event):
        self._create_file_change(event, "created")

    def on_modified(self, event):
        self._create_file_change(event, "modified")

    def on_deleted(self, event):
        self._create_file_change(event, "deleted")


def file_watchers_after_create(file_watcher):
    if file_watcher.is_active and file_watcher.name not in observers_registry:
        # Start watching this path
        event_handler = SimpleFileChangeHandler(file_watcher)
        observer = Observer()
        observer.schedule(event_handler, path=file_watcher.path, recursive=True)
        observer.start()
        observers_registry[file_watcher.name] = observer
        logger.debug(f"Started watching: {file_watcher.path}")
    elif not file_watcher.is_active and file_watcher.name in observers_registry:
        # Stop watching this path
        observer = observers_registry.pop(file_watcher.name)
        observer.stop()
        observer.join()
        logger.debug(f"Stopped watching: {file_watcher.path}")
