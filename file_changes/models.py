import logging

from django.conf import settings
from django.db import models

from flows.flows.file_changes_after_save import file_changes_after_save
from workspaces.models import WorkspaceRelated

temp_logger = logging.getLogger("django.not_used")


class FileChange(WorkspaceRelated):
    file_watcher = models.ForeignKey(
        "file_watchers.FileWatcher",
        on_delete=models.CASCADE,
        related_name="file_changes",
        help_text="The file watcher that detected this change.",
    )
    file_path = models.CharField(
        max_length=1024, help_text="The path of the file that was changed."
    )
    change_type = models.CharField(
        max_length=50,
        help_text="Type of change detected (e.g., modified, created, deleted).",
    )
    timestamp = models.DateTimeField(
        auto_now_add=True, help_text="Timestamp of when the change was detected."
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        help_text="The user responsible for the file change, if known.",
    )

    def __str__(self):
        return f"FileChanged(file_path={self.file_path}, change_type={self.change_type}, timestamp={self.timestamp})"

    def save(self, *args, **kwargs):
        temp_logger.debug(f"Saving FileChange: {self}")
        super().save(*args, **kwargs)
        file_changes_after_save(self)
        temp_logger.debug(f"FileChange saved: {self}")
