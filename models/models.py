# models/models.py
from django.db import models

from workspaces.models import WorkspaceRelated


class Model(WorkspaceRelated):
    """
    Example Django model named 'Model' inheriting from WorkspaceRelated.
    This model is associated with a File and includes a 'content' field.
    """

    # app = models.ForeignKey(App, on_delete=models.CASCADE, related_name="models")
    singular_name = models.CharField(max_length=255)
    plural_name = models.CharField(max_length=255)
    file = models.OneToOneField(
        "files.File", on_delete=models.CASCADE, related_name="model"
    )

    def __str__(self):
        return self.app.plural_name

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # update_entity_v1(self)
