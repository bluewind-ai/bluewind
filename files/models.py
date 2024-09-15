from django.db import models

from workspaces.models import WorkspaceRelated


class File(WorkspaceRelated):
    path = models.CharField(max_length=255, unique=True, help_text="The file path.")
    content = models.TextField(help_text="The content of the file.")

    def __str__(self):
        return self.path
