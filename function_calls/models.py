import logging

from django.db import models
from django.shortcuts import get_object_or_404
from django.urls import reverse
from django.utils import timezone

from bluewind.context_variables import get_function, get_function_call, get_superuser
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
    output_data_dependency = models.ForeignKey(
        "function_calls.FunctionCall",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="function_calls_related_output",
    )
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

        self.user_id = get_superuser().id
        if self.id == 1:
            raise_debug(self.id, self.tn_parent, skip=0)
        super().save(*args, **kwargs)
        # if self.id == 1:
        #     raise_debug(self.id, not self.function, not self.tn_parent, skip=1)

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
            self.Status.CONDITIONS_NOT_MET: "⚪",
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


def get_whole_tree(function_call):
    def _to_dict(function_call):
        children = function_call.get_children(cache=False)

        def sort_key(child):
            return (
                child.executed_at
                if child.executed_at is not None
                else timezone.datetime.max,
                child.id or float("inf"),
            )

        sorted_children = sorted(children, key=sort_key)

        change_url = reverse(
            "admin:function_calls_functioncall_change", args=[function_call.id]
        )
        emoji = function_call.get_status_emoji()

        return {
            "id": str(function_call.id) if function_call.id else None,
            "text": f"{str(function_call)} {emoji}",
            "status": function_call.status,
            "executed_at": function_call.executed_at.isoformat()
            if function_call.executed_at
            else None,
            "children": [_to_dict(child) for child in sorted_children]
            if function_call.id
            else [],
            "data": {"change_url": change_url},
        }

    if function_call.function.name != "master_v1":
        root = function_call.get_root(cache=False)
    else:
        root = function_call

    return _to_dict(root)


def get_function_call_whole_tree_v1(function_call_id):
    function_call = get_object_or_404(FunctionCall, id=function_call_id)

    tree_data = get_whole_tree(function_call)
    return [tree_data]
