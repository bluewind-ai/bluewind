import logging

from django.db import models

from file_watchers.after_create import file_watchers_after_create
from workspaces.models import WorkspaceRelated

# Initialize the logger
temp_logger = logging.getLogger("django.debug")

observers_registry = {}


class FileWatcher(WorkspaceRelated):
    """
    Model to represent a file or directory that is being watched for changes.
    """

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        RUNNING = "running", "Running"
        SHUTTING_DOWN = "shutting-down", "Shutting Down"
        TERMINATED = "terminated", "Terminated"

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
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
        return f"FileWatcher(path={self.path}, is_active={self.is_active})"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new:
            file_watchers_after_create(self)

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
