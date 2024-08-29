# models.py
from django.db import models
from bluewind.utils import uuid7

class BaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid7, editable=False)
    workspace_public_id = models.CharField(max_length=50)

    class Meta:
        abstract = True