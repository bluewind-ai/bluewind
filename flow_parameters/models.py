from django.db import models

from flow_parameters.after_create import flow_parameters_after_create
from flow_parameters.after_update import flow_parameters_after_update
from flow_parameters.before_create import flow_parameters_before_create
from flow_parameters.before_update import flow_parameters_before_update
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

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        if is_new:
            flow_parameters_before_create(self)
        else:
            flow_parameters_before_update(self)
        super().save(*args, **kwargs)
        if is_new:
            flow_parameters_after_create(self)
        else:
            flow_parameters_after_update(self)
