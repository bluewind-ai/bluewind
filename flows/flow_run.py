import logging

from django.db import models

from workspaces.models import WorkspaceRelated

logger = logging.getLogger(__name__)
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

# class FlowRun(WorkspaceRelated):
#     class Status(models.TextChoices):
#         NOT_STARTED = "NOT_STARTED", "Not Started"
#         IN_PROGRESS = "IN_PROGRESS", "In Progress"
#         COMPLETED = "COMPLETED", "Completed"

#     flow = models.ForeignKey("Flow", on_delete=models.CASCADE, related_name="runs")
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
#     status = models.CharField(
#         max_length=20, choices=Status.choices, default=Status.NOT_STARTED
#     )
#     state = models.JSONField(default=dict, blank=True)
#     diff = models.ForeignKey(
#         WorkspaceDiff,
#         on_delete=models.SET_NULL,
#         null=True,
#         blank=True,
#         related_name="flow_runs",
#     )
#     create_new_workspace = models.BooleanField(default=False)
#     input_data = models.JSONField(default=dict, blank=True, encoder=DjangoJSONEncoder)

#     def __str__(self):
#         return f"Run of {self.flow.name} at {self.created_at}"

#     def save(self, *args, **kwargs):
#         is_new = self._state.adding
#         super().save(*args, **kwargs)

#         if is_new and self.flow.type == "python":
#             result = flow_runner(self)
#             self.state = result
#             self.save(update_fields=["state", "diff"])

#     def update_status(self):
#         total_actions = self.flow.actions.count()
#         completed_actions = self.action_runs.filter(status="COMPLETED").count()
#         if completed_actions == 0:
#             new_status = self.Status.NOT_STARTED
#         elif completed_actions == total_actions:
#             new_status = self.Status.COMPLETED
#         else:
#             new_status = self.Status.IN_PROGRESS

#         if self.status != new_status:
#             self.status = new_status
#             self.save(update_fields=["status"])


class FlowRunArgument(WorkspaceRelated):
    flow_run = models.ForeignKey(
        FlowRun, on_delete=models.CASCADE, related_name="arguments"
    )
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")

    class Meta:
        unique_together = ("flow_run", "content_type", "object_id")

    def __str__(self):
        return f"Argument for {self.flow_run}: {self.content_object}"
