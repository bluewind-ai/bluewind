from django.db import models

from actions.models import Action
from flows.models import Flow
from steps.after_create import steps_after_create
from steps.after_update import steps_after_update
from steps.before_create import steps_before_create
from steps.before_update import steps_before_update
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

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        if is_new:
            steps_before_create(self)
        else:
            steps_before_update(self)
        super().save(*args, **kwargs)
        if is_new:
            steps_after_create(self)
        else:
            steps_after_update(self)
