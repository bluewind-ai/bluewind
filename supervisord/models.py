import os

from django.db import models

from supervisord.before_create import supervisord_before_create
from workspaces.models import WorkspaceRelated


class Supervisord(WorkspaceRelated):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        RUNNING = "running", "Running"
        SHUTTING_DOWN = "shutting-down", "Shutting Down"
        TERMINATED = "terminated", "Terminated"

    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.TERMINATED
    )
    last_action_time = models.DateTimeField(auto_now=True)

    # Hardcoded config file path
    CONFIG_FILE = "supervisord.conf"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        if is_new:
            supervisord_before_create(self)

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Supervisord (Config: {os.path.basename(self.CONFIG_FILE)}, Status: {self.get_status_display()})"
