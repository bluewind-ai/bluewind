from django.db import models
from encrypted_fields.fields import EncryptedCharField

from workspaces.models import WorkspaceRelated


class Credential(WorkspaceRelated):
    class Key(models.TextChoices):
        APOLLO_API_KEY = "apollo-api-key", "Apollo API Key"

    key = models.CharField(
        max_length=255,
        choices=Key.choices,
        default=Key.APOLLO_API_KEY,
    )

    value = EncryptedCharField(max_length=100000)
