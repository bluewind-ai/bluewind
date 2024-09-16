# models/models.py

from django.db import models

from files.models import File
from workspaces.models import WorkspaceRelated


class Model(WorkspaceRelated):
    """
    Example Django model named 'Model' inheriting from WorkspaceRelated.
    This model is associated with a File and includes a 'content' field.
    """

    name = models.CharField(max_length=100)
    app_label = models.CharField(max_length=100)
    file = models.ForeignKey(File, on_delete=models.CASCADE, related_name="models")

    def __str__(self):
        return self.name

    class Meta:
        unique_together = ("workspace", "name")
