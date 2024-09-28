# Create your models here.
from django.db import models

from functions.handle_function_call_after_save.v1.functions import (
    handle_function_call_after_save_v1,
)
from workspaces.models import WorkspaceRelated


class DomainName(WorkspaceRelated):
    name = models.CharField(max_length=253, unique=True)
    function_call = models.ForeignKey(
        "function_calls.FunctionCall",
        on_delete=models.CASCADE,
        related_name="domain_names",
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name

    class Meta:
        unique_together = ("workspace", "name")

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        handle_function_call_after_save_v1(self)
