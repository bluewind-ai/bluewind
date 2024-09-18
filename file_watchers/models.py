import logging

from django.db import models

from file_watchers.after_create import file_watchers_after_create
from file_watchers.after_update import file_watchers_after_update
from file_watchers.before_create import file_watchers_before_create
from file_watchers.before_update import file_watchers_before_update
from workspaces.models import WorkspaceRelated

# Initialize the logger
temp_logger = logging.getLogger("django.not_used")

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
        is_new = self.pk is None
        if is_new:
            file_watchers_before_create(self)
        else:
            file_watchers_before_update(self)
        super().save(*args, **kwargs)
        if is_new:
            file_watchers_after_create(self)
        else:
            file_watchers_after_update(self)

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
