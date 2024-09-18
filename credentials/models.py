from django.db import models
from encrypted_fields.fields import EncryptedCharField

from credentials.after_create import credentials_after_create
from credentials.after_update import credentials_after_update
from credentials.before_create import credentials_before_create
from credentials.before_update import credentials_before_update
from workspaces.models import WorkspaceRelated


class Credentials(WorkspaceRelated):
    key = models.CharField(max_length=255)
    value = EncryptedCharField(max_length=100000)

    def __str__(self):
        return f"{self.key} for workspace {self.workspace}"

    class Meta:
        verbose_name_plural = "Credentials"
        unique_together = ["workspace", "key"]

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        if is_new:
            credentials_before_create(self)
        else:
            credentials_before_update(self)
        super().save(*args, **kwargs)
        if is_new:
            credentials_after_create(self)
        else:
            credentials_after_update(self)
