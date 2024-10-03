import logging

from django.db import models
from django.utils import timezone

from bluewind.context_variables import get_function, get_function_call
from bluewind.utils import snake_case_to_spaced_camel_case
from treenode.models import TreeNodeModel
from users.models import User
from workspaces.models import WorkspaceRelated

logger = logging.getLogger("django.not_used")


class FunctionCall(WorkspaceRelated, TreeNodeModel):
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
    input_parameter_name = models.CharField(max_length=255)

    input_data = models.JSONField(default=dict, blank=True)
    output_data = models.JSONField(default=dict, blank=True)
    output_type = models.CharField(
        max_length=35,
        choices=OutputType.choices,
    )
    executed_at = models.DateTimeField(null=True, blank=True)
    function = models.ForeignKey(
        "functions.Function", on_delete=models.CASCADE, related_name="function_calls"
    )
    function_call = models.ForeignKey(
        "function_calls.FunctionCall", on_delete=models.CASCADE, null=True, blank=True
    )
    remaining_dependencies = models.IntegerField(default=0)
    thoughts = models.TextField(
        blank=True,
        null=True,
    )

    def save(self, *args, **kwargs):
        if not self.function:
            self.function = get_function()
        if not self.tn_parent:
            self.tn_parent = get_function_call()

        self.user_id = 1
        super().save(*args, **kwargs)

    def to_dict(self):
        children = self.get_children(cache=False)

        def sort_key(child):
            return (
                child.executed_at
                if child.executed_at is not None
                else timezone.make_aware(timezone.datetime.max),
                child.id or float("inf"),
            )

        sorted_children = sorted(children, key=sort_key)

        return {
            "id": self.id if self.id else None,
            "function_name": str(self),
            "status": self.status,
            "executed_at": self.executed_at.isoformat() if self.executed_at else None,
            "children": [child.to_dict() for child in sorted_children]
            if self.id
            else [],
        }

    def get_whole_tree(self):
        if self.function.name != "master_v1":
            root = self.get_root(cache=False)
        else:
            root = self

        return root.to_dict()

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
        return f"{snake_case_to_spaced_camel_case(self.function.name)}"

    @property
    def parent(self):
        return super().tn_parent

    @parent.setter
    def parent(self, value):
        self.tn_parent_id = value.id if value else None

    def get_status_emoji(self):
        emoji_map = {
            self.Status.CONDITIONS_NOT_MET: "🔄",
            self.Status.READY_FOR_APPROVAL: "🟡",
            self.Status.RUNNING: "🔄",
            self.Status.COMPLETED: "🟢",
            self.Status.COMPLETED_READY_FOR_APPROVAL: "🟠",
            self.Status.MARKED_SUCCESSFUL: "🟢",
            self.Status.MARKED_FAILED: "🔴",
            self.Status.SUCCESSFUL: "🟢",
            self.Status.CANCELLED: "🚫",
        }
        return emoji_map.get(self.status, "")
