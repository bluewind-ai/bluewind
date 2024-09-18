# apps/models.py
from django.db import models

from apps.after_create import apps_after_create
from apps.after_update import apps_after_update
from apps.before_create import apps_before_create
from apps.before_update import apps_before_update
from workspaces.models import WorkspaceRelated


class App(WorkspaceRelated):
    plural_name = models.CharField(max_length=100)

    def __str__(self):
        return self.plural_name

    class Meta:
        unique_together = ("workspace", "plural_name")

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        if is_new:
            apps_before_create(self)
        else:
            apps_before_update(self)
        super().save(*args, **kwargs)
        if is_new:
            apps_after_create(self)
        else:
            apps_after_update(self)
