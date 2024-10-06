# Create your models here.
from django.db import models

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
    last_scanned_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.name

    # def save(self, *args, **kwargs):
    #     raise_debug(self)
    #     if not self.function_call:
    #         self.function_call = get_function_call()
    #     super().save(*args, **kwargs)
