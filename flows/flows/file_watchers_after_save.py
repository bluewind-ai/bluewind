import logging

# Import the utility function
from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

from file_changes.models import FileChange
from flows.flows.is_ignored_by_git import is_ignored_by_git

temp_logger = logging.getLogger("django.not_used")
observers_registry = {}


class DynamicFileChangeHandler(FileSystemEventHandler):
    """
    Custom handler to respond to file system changes.
    """

    def __init__(self, file_watcher):
        super().__init__()
        self.file_watcher = file_watcher

    def on_modified(self, event):
        temp_logger.debug(f"Detected change in file: {event.src_path}")

        # Check if the file is gitignored
        if is_ignored_by_git(event.src_path):
            temp_logger.debug(
                f"File {event.src_path} is .gitignored, skipping logging."
            )
            return

        # Log the file change in the database
        try:
            FileChange.objects.create(
                file_watcher=self.file_watcher,
                file_path=event.src_path,
                change_type="modified",
                user=self.file_watcher.user,  # Assuming the user is set in FileWatcher
                workspace=self.file_watcher.workspace,  # Set workspace from the FileWatcher
            )
            temp_logger.debug(f"FileChange created for {event.src_path}")
        except Exception as e:
            temp_logger.error(f"Error creating FileChange: {e}")


def file_watchers_after_save(file_watcher):
    if file_watcher.is_active and file_watcher.name not in observers_registry:
        # Start watching this path
        event_handler = DynamicFileChangeHandler(file_watcher)
        observer = Observer()
        observer.schedule(event_handler, path=file_watcher.path, recursive=True)
        observer.start()
        observers_registry[file_watcher.name] = observer
        temp_logger.debug(f"Started watching: {file_watcher.path}")
    elif not file_watcher.is_active and file_watcher.name in observers_registry:
        # Stop watching this path
        observer = observers_registry.pop(file_watcher.name)
        observer.stop()
        observer.join()
        temp_logger.debug(f"Stopped watching: {file_watcher.path}")
