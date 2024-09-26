import logging

from django.db import models

from workspaces.models import WorkspaceRelated

logger = logging.getLogger(__name__)


class Function(WorkspaceRelated):
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    file = models.OneToOneField(
        "files.File", on_delete=models.CASCADE, related_name="function"
    )
    version_number = models.IntegerField()

    class Meta:
        unique_together = ["name", "workspace"]
