import logging

from django.db import models

from bluewind.context_variables import get_function, get_function_call
from bluewind.utils import snake_case_to_spaced_camel_case
from treenode.models import TreeNodeModel
from users.models import User
from workspaces.models import Workspace, WorkspaceRelated

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
    whole_tree = models.JSONField()

    def save(self, *args, **kwargs):
        self.function = get_function()
        self.tn_parent = get_function_call()

        is_new = self._state.adding
        if is_new:
            self.whole_tree = self.to_dict()

        super().save(*args, **kwargs)

        # Rebuild and update the whole tree
        # raise_debug("1")
        whole_tree, nodes = self.rebuild_whole_tree()
        self.whole_tree = whole_tree

        # Save again with the updated whole_tree
        super().save(update_fields=["whole_tree"])

        # Update other nodes if not a new instance
        if not is_new:
            self.bulk_update_whole_tree(whole_tree, nodes)

    def to_dict(self):
        return {
            "id": self.id if self.id else None,
            "function_name": str(self),
            "status": self.status,
            "children": [child.to_dict() for child in self.get_children(cache=False)]
            if self.id
            else [],
        }

    def rebuild_whole_tree(self):
        if self.function.name != "master_v1":
            root = self.get_root(cache=False)

        else:
            root = self

        tree_dict = root.to_dict()
        nodes = [root] + list(root.get_descendants(cache=False))
        return tree_dict, nodes

    def bulk_update_whole_tree(self, whole_tree, nodes):
        for node in nodes:
            node.whole_tree = whole_tree
        FunctionCall.objects.bulk_update(nodes, ["whole_tree"])

    @classmethod
    def rebuild_all_trees(cls):
        for root in cls.objects.filter(tn_parent__isnull=True):
            whole_tree, nodes = root.rebuild_whole_tree()
            root.bulk_update_whole_tree(whole_tree, nodes)

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
