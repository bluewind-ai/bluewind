from django.db import models

from base_model.models import BaseModel

class DBGraph(BaseModel):
    class Meta:
        verbose_name_plural = "Database Graph"
        managed = False  # This model won't be managed by Django

    def __str__(self):
        return "Database Graph"