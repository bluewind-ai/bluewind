# workspaces/models.py
import logging

from django.db import models

from users.models import User
from workspaces.models import Workspace, WorkspaceRelated

logger = logging.getLogger("django.not_used")


class FlowRun(WorkspaceRelated):
    class Status(models.TextChoices):
        CONDITIONS_NOT_MET = "conditions-not-met", "Conditions Not Met"
        READY = "ready", "READY"
        RUNNING = "running", "Running"
        COMPLETED = "completed", "Completed"

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.CONDITIONS_NOT_MET,
    )
    state = models.JSONField(default=dict)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE)
    input_data = models.JSONField(null=True, blank=True)
    output_data = models.JSONField(null=True, blank=True)
    executed_at = models.DateTimeField(null=True, blank=True)
    flow = models.ForeignKey("flows.Flow", on_delete=models.CASCADE)
    status = models.CharField(max_length=50, default="PENDING")

    def __str__(self):
        return f"FlowRun {self.id} by {self.user} on {self.executed_at}"
