from django.db import models

from bluewind.context_variables import get_user_id, get_workspace_id
from workspaces.models import WorkspaceRelated


class GunicornInstance(WorkspaceRelated):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        RUNNING = "running", "Running"
        SHUTTING_DOWN = "shutting-down", "Shutting Down"
        TERMINATED = "terminated", "Terminated"

    master_pid = models.IntegerField(
        unique=True, help_text="Process ID of the Gunicorn instance"
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Gunicorn Instance (PID: {self.master_pid}, Status: {self.get_status_display()})"

    def save(self, *args, **kwargs):
        if not self.pk:
            self.user_id = get_user_id()
            self.workspace_id = get_workspace_id()
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        # gunicorn_instance_before_delete(self)
        super().delete(*args, **kwargs)
