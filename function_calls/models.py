# workspaces/models.py
import logging

from django.db import models
from treenode.models import TreeNodeModel

from users.models import User
from workspaces.models import Workspace, WorkspaceRelated

logger = logging.getLogger("django.not_used")


class FunctionCall(WorkspaceRelated, TreeNodeModel):
    # node_order_by = ["executed_at"]

    class Status(models.TextChoices):
        CONDITIONS_NOT_MET = "conditions-not-met", "Conditions Not Met"
        READY_FOR_APPROVAL = "ready-for-approval", "Ready for Approval"
        RUNNING = "running", "Running"
        COMPLETED = "completed", "Completed"
        COMPLETED_READY_FOR_APPROVAL = (
            "completed-ready-for-approval",
            "Completed Ready for Approval",
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
        CANCELLED = "cancelled", "Cancelled"

    class OutputType(models.TextChoices):
        QUERY_SET = "queryset", "queryset"

    class Meta(TreeNodeModel.Meta):
        verbose_name = "Function Call"
        verbose_name_plural = "Function Calls"

    treenode_display_field = "function"

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
    input_data = models.JSONField(default=dict, blank=True)
    output_data = models.JSONField(default=dict, blank=True)
    output_type = models.CharField(
        max_length=35,
        choices=Status.choices,
    )

    executed_at = models.DateTimeField(null=True, blank=True)
    function = models.ForeignKey("functions.Function", on_delete=models.CASCADE)
    remaining_dependencies = models.IntegerField(default=0)

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

    @classmethod
    def uncompleted_stages(cls):
        return [
            cls.Status.CONDITIONS_NOT_MET,
            cls.Status.RUNNING,
            cls.Status.READY_FOR_APPROVAL,
            cls.Status.COMPLETED_READY_FOR_APPROVAL,
        ]

    @property
    def is_successful_terminal_stage(self):
        return self.status in self.successful_terminal_stages()

    def __str__(self):
        return f"{self.function.name} on {self.executed_at}"

    @property
    def parent(self):
        return super().parent

    @parent.setter
    def parent(self, value):
        self.parent_id = value.id if value else None

    def save(self, *args, **kwargs):
        if self.id:
            before = FunctionCall.objects.get(id=self.id).executed_at
            after = self.executed_at
            if before is not None and before != after:
                raise_debug(self, before, after)

        return super().save(*args, **kwargs)
