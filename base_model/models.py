# models.py
import logging

from model_clone import CloneMixin

from django.db import models

logger = logging.getLogger(__name__)


class BaseModel(CloneMixin, models.Model):
    public_id = models.CharField(max_length=100, unique=True, editable=False)

    class Meta:
        abstract = True

    _clone_excluded_fields = [
        "id",
        "public_id",
    ]  # Exclude id and public_id from cloning
