# workspaces/models.py
import logging

from django.db import models

from flow_runs.after_create import flow_runs_after_create
from flow_runs.after_update import flow_runs_after_update
from flow_runs.before_create import flow_runs_before_create
from flow_runs.before_update import flow_runs_before_update
from users.models import User
from workspaces.models import Workspace, WorkspaceRelated

logger = logging.getLogger("django.not_used")


class FlowRun(WorkspaceRelated):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE)
    input_data = models.JSONField(null=True, blank=True)
    output_data = models.JSONField(null=True, blank=True)
    executed_at = models.DateTimeField(null=True, blank=True)
    flow = models.ForeignKey("flows.Flow", on_delete=models.CASCADE)

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        if is_new:
            flow_runs_before_create(self)
        else:
            flow_runs_before_update(self)
        super().save(*args, **kwargs)
        if is_new:
            flow_runs_after_create(self)
        else:
            flow_runs_after_update(self)

    def __str__(self):
        return f"FlowRun {self.id} by {self.user} on {self.executed_at}"
