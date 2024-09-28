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
    input_parameter_name = models.CharField(max_length=255)
    input_form_data = models.ForeignKey(
        "form_data.FormData",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="function_calls_using_as_input",
    )
    output_form_data = models.ForeignKey(
        "form_data.FormData",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="function_calls_using_as_output",
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

    @classmethod
    def successful_terminal_stages(cls):
        return [
            cls.Status.COMPLETED,
            cls.Status.MARKED_SUCCESSFUL,
            cls.Status.SUCCESSFUL,
        ]

    @property
    def is_successful_terminal_stage(self):
        return self.status in self.successful_terminal_stages()

    def __str__(self):
        return f"{self.function.name} on {self.executed_at}"
