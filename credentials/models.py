from encrypted_fields.fields import EncryptedCharField

from django.db import models
from workspaces.models import WorkspaceRelated


class Credentials(WorkspaceRelated):
    key = models.CharField(max_length=255)
    value = EncryptedCharField(max_length=255)

    def __str__(self):
        return f"{self.key} for workspace {self.workspace}"

    class Meta:
        verbose_name_plural = "Credentials"
        unique_together = ["workspace", "key"]
