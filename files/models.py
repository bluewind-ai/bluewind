from django.db import models

from workspaces.models import WorkspaceRelated


class File(WorkspaceRelated):
    path = models.CharField(max_length=255, help_text="The file path.")
    content = models.TextField(help_text="The content of the file.")
    created_at = models.DateTimeField(
        auto_now_add=True, help_text="Timestamp when the file was created."
    )
    updated_at = models.DateTimeField(
        auto_now=True, help_text="Timestamp when the file was last updated."
    )
    function = models.OneToOneField(
        "functions.Function",
        on_delete=models.CASCADE,
        related_name="related_file",
        null=True,
    )
    function_call = models.OneToOneField(
        "function_calls.FunctionCall",
        on_delete=models.CASCADE,
        related_name="related_file",
        null=True,
    )

    def __str__(self):
        return self.path

    class Meta:
        ordering = ["-updated_at"]
        unique_together = ["workspace", "path"]
