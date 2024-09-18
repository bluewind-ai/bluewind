# models/models.py
from django.db import models

from apps.models import App
from files.models import File
from models.after_create import models_after_create
from models.after_update import models_after_update
from models.before_create import models_before_create
from models.before_update import models_before_update
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

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        if is_new:
            models_before_create(self)
        else:
            models_before_update(self)
        super().save(*args, **kwargs)
        if is_new:
            models_after_create(self)
        else:
            models_after_update(self)
