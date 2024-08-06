# models.py
from django.db import models
from public_id.models import PublicIDField

class BaseModel(models.Model):
    # public_id = PublicIDField()

    class Meta:
        abstract = True