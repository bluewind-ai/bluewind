import logging

from django.db import models

from workspaces.models import WorkspaceRelated

logger = logging.getLogger(__name__)

logger = logging.getLogger(__name__)


class Flow(WorkspaceRelated):
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    type = models.CharField(
        max_length=10,
        choices=[("no-code", "No Code"), ("python", "Python")],
        default="no-code",
    )

    class Meta:
        unique_together = ["name", "workspace"]

    def __str__(self):
        return self.name
