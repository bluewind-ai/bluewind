from django.db import models

from files.after_create import files_after_create
from workspaces.models import WorkspaceRelated


class File(WorkspaceRelated):
    path = models.CharField(max_length=255, unique=True, help_text="The file path.")
    content = models.TextField(help_text="The content of the file.")

    def __str__(self):
        return self.path

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)

        if is_new:
            files_after_create(self)
