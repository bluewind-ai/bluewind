from django.db import models

from workspaces.models import WorkspaceRelated


class Base64Conversion(WorkspaceRelated):
    input_text = models.TextField()
    output_text = models.TextField(blank=True)
    operation = models.CharField(
        max_length=10,
        choices=[("encode", "Encode to Base64"), ("decode", "Decode from Base64")],
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Base64 Conversion"
        verbose_name_plural = "Base64 Conversions"

    def __str__(self):
        return f"{self.operation} at {self.created_at}"
