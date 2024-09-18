from django.db import models

# Create your models here.
from workspaces.models import WorkspaceRelated


class Recording(WorkspaceRelated):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.name

    class Meta:
        unique_together = ["name", "workspace"]
