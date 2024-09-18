from django.db import models

from workspaces.models import WorkspaceRelated

# Create your models here.


class FlowParameter(WorkspaceRelated):
    flow = models.ForeignKey(
        "flows.Flow", on_delete=models.CASCADE, related_name="parameters"
    )
    name = models.CharField(max_length=255)
    model = models.ForeignKey("models.Model", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ["flow", "name", "workspace"]

    def __str__(self):
        return f"{self.flow.name} - {self.name} ({self.model.name})"
