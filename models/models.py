# models/models.py

from django.db import models

from workspaces.models import WorkspaceRelated


class Model(WorkspaceRelated):
    """
    Example Django model named 'Model' inheriting from WorkspaceRelated.
    This model now includes a 'content' field to store file content.
    """

    name = models.CharField(max_length=100)
    content = models.TextField(blank=True, null=True)  # Field to store file content
    app_label = models.CharField(max_length=100)

    def __str__(self):
        return self.name

    class Meta:
        unique_together = ("workspace", "name")
