# workspaces/models.py
import logging

from django.db import models

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

    def __str__(self):
        return f"FlowRun {self.id} by {self.user} on {self.executed_at}"
