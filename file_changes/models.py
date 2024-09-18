import logging

from django.conf import settings
from django.db import models

from file_changes.after_create import file_changes_after_create
from file_changes.after_update import file_changes_after_update
from file_changes.before_create import file_changes_before_create
from file_changes.before_update import file_changes_before_update
from workspaces.models import WorkspaceRelated

# Setup logger for debugging
temp_logger = logging.getLogger("django.debug")


# Setup logger for debugging
temp_logger = logging.getLogger("django.debug")


class FileChange(WorkspaceRelated):
    file_watcher = models.ForeignKey(
        "file_watchers.FileWatcher",
        on_delete=models.CASCADE,
        related_name="file_changes",
        help_text="The file watcher that detected this change.",
    )
    source_path = models.CharField(
        max_length=255,
        help_text="The path of the file that was changed.",
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
        return f"{self.change_type} on {self.source_path} at {self.timestamp}"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        if is_new:
            file_changes_before_create(self)
        else:
            file_changes_before_update(self)
        super().save(*args, **kwargs)
        if is_new:
            file_changes_after_create(self)
        else:
            file_changes_after_update(self)
