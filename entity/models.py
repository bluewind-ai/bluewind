from django.db import models
from workspaces.models import WorkspaceRelated


class Entity(WorkspaceRelated):
    name = models.CharField(max_length=255)  # Keep this at 255 for now
    model = models.ForeignKey(
        "flows.Model", on_delete=models.CASCADE, related_name="entities"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Entities"

    def __str__(self):
        return f"{self.name} ({self.model.name})"
