from django.db import models

class DBGraph(models.Model):
    class Meta:
        verbose_name_plural = "Database Graph"
        managed = False  # This model won't be managed by Django

    def __str__(self):
        return "Database Graph"