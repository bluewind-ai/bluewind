# flows/models.py
from django.db import models
from django.db.models import JSONField
from django.utils import timezone

from flows.models import Flow
from workspaces.models import WorkspaceRelated


class FlowRun(WorkspaceRelated):
    flow = models.ForeignKey(Flow, on_delete=models.CASCADE, related_name="runs")
    executed_at = models.DateTimeField(default=timezone.now)
    input_data = JSONField(default=dict, blank=True)
    result = models.TextField(blank=True)

    def __str__(self):
        return f"Run of {self.flow.name} at {self.executed_at}"
