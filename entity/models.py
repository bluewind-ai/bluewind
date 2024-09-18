from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

from entity.after_create import entity_after_create
from entity.after_update import entity_after_update
from entity.before_create import entity_before_create
from entity.before_update import entity_before_update
from workspaces.models import WorkspaceRelated


class Entity(WorkspaceRelated):
    name = models.CharField(max_length=255)  # Keep this at 255 for now
    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, related_name="entities"
    )
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Entities"
        unique_together = ("workspace", "content_type", "object_id")

    def __str__(self):
        return f"{self.name} ({self.content_type.model})"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        if is_new:
            entity_before_create(self)
        else:
            entity_before_update(self)
        super().save(*args, **kwargs)
        if is_new:
            entity_after_create(self)
        else:
            entity_after_update(self)
