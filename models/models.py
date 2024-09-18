# models/models.py
from django.db import models

from apps.models import App
from files.models import File
from workspaces.models import WorkspaceRelated


class Model(WorkspaceRelated):
    """
    Example Django model named 'Model' inheriting from WorkspaceRelated.
    This model is associated with a File and includes a 'content' field.
    """

    app = models.ForeignKey(App, on_delete=models.CASCADE, related_name="models")
    file = models.OneToOneField(File, on_delete=models.CASCADE, related_name="model")

    def __str__(self):
        return self.app.plural_name
