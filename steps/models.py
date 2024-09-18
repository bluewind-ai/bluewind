from django.db import models

from actions.models import Action
from flows.models import Flow
from workspaces.models import WorkspaceRelated


class Step(WorkspaceRelated):
    flow = models.ForeignKey(Flow, on_delete=models.CASCADE, related_name="steps")
    parent_step = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="child_steps",
    )
    action = models.ForeignKey(Action, on_delete=models.CASCADE, related_name="steps")

    def __str__(self):
        return f"Step of {self.flow.name}"
