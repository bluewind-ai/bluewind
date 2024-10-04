from django.db import models

from bluewind.context_variables import get_superuser, get_workspace
from daphne_processes.before_create import daphne_processes_before_create
from daphne_processes.before_delete import daphne_process_before_delete
from workspaces.models import WorkspaceRelated


class DaphneProcess(WorkspaceRelated):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        RUNNING = "running", "Running"
        SHUTTING_DOWN = "shutting-down", "Shutting Down"
        TERMINATED = "terminated", "Terminated"

    master_pid = models.IntegerField(help_text="Process ID of the Daphne process")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Daphne Process (PID: {self.master_pid}, Status: {self.get_status_display()})"

    def save(self, *args, **kwargs):
        if not self.pk:
            self.user_id = get_superuser().id
            self.workspace = get_workspace()
        daphne_processes_before_create(self)
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        daphne_process_before_delete(self)
        super().delete(*args, **kwargs)
