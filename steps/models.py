import logging

from django.db import models

from flows.actions import Action
from workspaces.models import WorkspaceRelated

logger = logging.getLogger(__name__)

logger = logging.getLogger(__name__)


# Create your models here.
class Step(WorkspaceRelated):
    flow = models.ForeignKey("Flow", on_delete=models.CASCADE, related_name="steps")
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
