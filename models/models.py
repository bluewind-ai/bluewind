# myapp/models.py

from django.db import models

from workspaces.models import WorkspaceRelated


class Model(WorkspaceRelated):
    """
    Example Django model named 'Model' inheriting from django.db.models.Model.
    Note: Naming a model 'Model' can be confusing since 'Model' is the base class.
    It's recommended to use a more descriptive name.
    """

    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

    class Meta:
        unique_together = ("workspace", "name")
