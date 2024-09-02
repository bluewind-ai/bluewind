# models.py
import logging

from model_clone import CloneMixin

from django.db import models

logger = logging.getLogger(__name__)


class BaseModel(CloneMixin, models.Model):
    class Meta:
        abstract = True

    _clone_excluded_fields = [
        "id",
    ]  # Exclude id and public_id from cloning
