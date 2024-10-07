from django.db import models
from encrypted_fields.fields import EncryptedCharField

from workspaces.models import WorkspaceRelated


class Credential(WorkspaceRelated):
    key = models.CharField(max_length=255)
    value = EncryptedCharField(max_length=100000)
