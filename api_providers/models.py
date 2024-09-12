from django.db import models

from workspaces.models import WorkspaceRelated


class ApiProvider(WorkspaceRelated):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name

    class Meta:
        unique_together = ["name", "workspace"]


class ApiKey(WorkspaceRelated):
    content = models.TextField()
    provider = models.ForeignKey(
        ApiProvider, on_delete=models.CASCADE, related_name="api_keys"
    )

    def __str__(self):
        return f"API Key for {self.provider.name}"
