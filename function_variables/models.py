from django.db import models

from workspaces.models import WorkspaceRelated


class FunctionVariable(WorkspaceRelated):
    TYPE_CHOICES = [
        ("input", "Input"),
        ("output", "Output"),
    ]

    function = models.ForeignKey(
        "functions.Function", on_delete=models.CASCADE, related_name="variables"
    )
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=6, choices=TYPE_CHOICES)
    order = models.IntegerField()
    model = models.ForeignKey("models.Model", on_delete=models.CASCADE)

    class Meta:
        unique_together = ["function", "name"]
        ordering = ["order"]

    def __str__(self):
        return f"{self.get_type_display()} {self.name} for {self.function.name} (Model: {self.model.name})"
