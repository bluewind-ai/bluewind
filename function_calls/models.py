# workspaces/models.py
import logging

from django.db import models

from users.models import User
from workspaces.models import Workspace, WorkspaceRelated

logger = logging.getLogger("django.not_used")


class FunctionCall(WorkspaceRelated):
    class Status(models.TextChoices):
        CONDITIONS_NOT_MET = "conditions-not-met", "Conditions Not Met"
        READY_FOR_APPROVAL = "ready-for-approval", "Ready for Approval"
        APPROVED = "approved", "Approved"
        RUNNING = "running", "Running"
        COMPLETED = "completed", "Completed"
        COMPLETED_READY_FOR_APPROVAL = (
            "completed-waiting-for-approval",
            "Completed Waiting for Approval",
        )
        MARKED_SUCCESSFUL = (
            "marked-successful",
            "Marked Successful",
        )
        MARKED_FAILED = (
            "marked-failed",
            "Marked Failed",
        )
        SUCCESSFUL = (
            "successful",
            "Successful",
        )

    status = models.CharField(
        max_length=35,
        choices=Status.choices,
        default=Status.CONDITIONS_NOT_MET,
    )
    state = models.JSONField(default=dict)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE)
    input_data = models.JSONField(default=dict, blank=True)
    input_form = models.ForeignKey(
        "forms.Form",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="input_function_calls",
    )

    output_data = models.JSONField(default=dict, blank=True)
    output_form = models.ForeignKey(
        "forms.Form",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="output_function_calls",
    )
    executed_at = models.DateTimeField(null=True, blank=True)
    function = models.ForeignKey("functions.Function", on_delete=models.CASCADE)
    parent = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="children",
    )
    thoughts = models.TextField(
        blank=True,
        null=True,
    )

    def __str__(self):
        return f"{self.function.name} on {self.executed_at}"
