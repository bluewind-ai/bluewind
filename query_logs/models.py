# Create a new file named models.py in your logging app (or add to an existing one)

from django.conf import settings
from django.db import models

from workspaces.models import WorkspaceRelated


class QueryLog(WorkspaceRelated):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    workspace = models.ForeignKey(
        "workspaces.Workspace", on_delete=models.SET_NULL, null=True, blank=True
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    logger_name = models.CharField(max_length=100)
    level = models.CharField(max_length=20)
    sql = models.TextField(max_length=10000)
    params = models.TextField(max_length=1000, blank=True, null=True)
    execution_time = models.FloatField(null=True, blank=True)
    database_alias = models.CharField(max_length=50, blank=True, null=True)
    app_label = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.timestamp} - {self.logger_name} - {self.level}"
