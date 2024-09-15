import logging

from django.db import models

from flows.flows.file_watchers_after_save import file_watchers_after_save
from workspaces.models import WorkspaceRelated

# Initialize the logger
temp_logger = logging.getLogger("django.temp")

# Maintain a global registry of observers
observers_registry = {}


class FileWatcher(WorkspaceRelated):
    """
    Model to represent a file or directory that is being watched for changes.
    """

    name = models.CharField(
        max_length=255, unique=True, help_text="A unique name for the file watcher."
    )
    path = models.CharField(
        max_length=1024, help_text="The path of the file or directory to watch."
    )
    is_active = models.BooleanField(
        default=True, help_text="Whether this file watcher is active or not."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"FileWatcher(name={self.name}, path={self.path}, is_active={self.is_active})"

    class Meta:
        unique_together = ["name", "workspace"]

    def save(self, *args, **kwargs):
        temp_logger.debug(f"Saving FileWatcher: {self}")
        # Call the original save method
        super().save(*args, **kwargs)
        file_watchers_after_save(self)
        temp_logger.debug(f"FileWatcher saved: {self}")

    def delete(self, *args, **kwargs):
        temp_logger.debug(f"Deleting FileWatcher: {self}")
        # Stop the observer if it is active
        if self.name in observers_registry:
            observer = observers_registry.pop(self.name)
            observer.stop()
            observer.join()
            temp_logger.debug(f"Stopped watching: {self.path}")

        # Call the original delete method
        super().delete(*args, **kwargs)
        temp_logger.debug(f"FileWatcher deleted: {self}")
