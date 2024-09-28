# Create your models here.
import logging
import re

from django.db import models

from workspaces.models import WorkspaceRelated

logger = logging.getLogger(__name__)


class Form(WorkspaceRelated):
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    file = models.OneToOneField(
        "files.File", on_delete=models.CASCADE, related_name="form"
    )

    class Meta:
        unique_together = ["name", "workspace"]

    @property
    def name_without_version(self):
        return re.sub(r"_v\d+$", "", self.name)

    @property
    def version_number(self):
        match = re.search(r"_v(\d+)$", self.name)
        return int(match.group(1))

    def __str__(self):
        return self.name
