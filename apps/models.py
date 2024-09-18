# apps/models.py

from django.db import models

from workspaces.models import WorkspaceRelated


class App(WorkspaceRelated):
    plural_name = models.CharField(max_length=100)

    def __str__(self):
        return self.plural_name

    class Meta:
        unique_together = ("workspace", "plural_name")
