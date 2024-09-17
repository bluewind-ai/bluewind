import logging
import os

from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

from file_changes.models import FileChange
from files.models import File
from flows.is_ignored_by_git.flows import is_ignored_by_git
from flows.models import Flow

temp_logger = logging.getLogger("django.temp")
observers_registry = {}


class DynamicFileChangeHandler(FileSystemEventHandler):
    def __init__(self, file_watcher):
        super().__init__()
        self.file_watcher = file_watcher

    def _handle_file_event(self, event, change_type):
        if is_ignored_by_git(event.src_path) or ".git" in event.src_path:
            temp_logger.debug(f"Path {event.src_path} is ignored, skipping logging.")
            return

        if os.path.isdir(event.src_path):
            temp_logger.debug(
                f"Path {event.src_path} is a directory, skipping file creation."
            )
            return

        file_instance, created = File.objects.get_or_create(
            path=event.src_path,
            defaults={
                "content": "",
                "user_id": self.file_watcher.user_id,
                "workspace": self.file_watcher.workspace,
            },
        )

        if change_type == "created" or change_type == "modified":
            with open(event.src_path, "r") as f:
                file_instance.content = f.read()
            file_instance.save()

        FileChange.objects.create(
            file_watcher=self.file_watcher,
            file=file_instance,
            change_type=change_type,
            user_id=self.file_watcher.user_id,
            workspace=self.file_watcher.workspace,
        )
        temp_logger.debug(f"FileChange ({change_type}) created for {event.src_path}")

        # Handle Flow creation for 'flows.py' files
        if change_type == "created" and os.path.basename(event.src_path) == "flows.py":
            parent_dir = os.path.basename(os.path.dirname(event.src_path))
            Flow.objects.get_or_create(
                name=parent_dir,
                file=file_instance,
                workspace=self.file_watcher.workspace,
                defaults={
                    "user_id": self.file_watcher.user_id,
                },
            )
            temp_logger.debug(
                f"Flow created for {event.src_path} with name {parent_dir}"
            )

    def on_created(self, event):
        temp_logger.debug(f"Detected creation of path: {event.src_path}")
        self._handle_file_event(event, "created")

    def on_modified(self, event):
        temp_logger.debug(f"Detected modification of path: {event.src_path}")
        self._handle_file_event(event, "modified")

    def on_deleted(self, event):
        temp_logger.debug(f"Detected deletion of path: {event.src_path}")

        if os.path.isdir(event.src_path):
            temp_logger.debug(f"Deleted path is a directory: {event.src_path}")
            self._handle_directory_deletion(event.src_path)
        else:
            self._delete_file_from_db(event.src_path)

    def _handle_directory_deletion(self, dir_path):
        # Delete all files in the database that start with this directory path
        files_to_delete = File.objects.filter(path__startswith=dir_path)
        for file in files_to_delete:
            self._delete_file_from_db(file.path)

    def _delete_file_from_db(self, file_path):
        file_instance = File.objects.get(path=file_path)
        file_instance.delete()
        temp_logger.debug(f"File {file_path} deleted from database")

        FileChange.objects.create(
            file_watcher=self.file_watcher,
            file=None,
            change_type="deleted",
            user_id=self.file_watcher.user_id,
            workspace=self.file_watcher.workspace,
        )
        temp_logger.debug(f"FileChange (deletion) created for {file_path}")

        # If this was a Python file, also delete the associated Flow
        if file_path.endswith(".py"):
            flow_name = os.path.basename(os.path.dirname(file_path))
            flow = Flow.objects.get(
                name=flow_name, workspace=self.file_watcher.workspace
            )
            flow.delete()
            temp_logger.debug(f"Flow {flow_name} deleted from database")


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
