# models.py
from django.db import models
from bluewind.utils import uuid7
from public_id.models import PublicIDField

class BaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid7, editable=False)

    class Meta:
        abstract = True