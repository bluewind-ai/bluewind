from django.contrib.contenttypes.models import ContentType
from django.db import models
from workspaces.models import WorkspaceRelated


class Entity(WorkspaceRelated):
    name = models.CharField(max_length=255)  # Keep this at 255 for now
    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, related_name="entities"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Entities"

    def __str__(self):
        return f"{self.name} ({self.content_type.model})"
