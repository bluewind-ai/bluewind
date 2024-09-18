import logging
import os
from urllib.parse import urlencode

from django.db import models
from django.urls import reverse

from apps.models import App
from files.models import File
from flows.flows_after_save.flows import flows_after_save
from workspaces.models import WorkspaceRelated

logger = logging.getLogger(__name__)

logger = logging.getLogger(__name__)


import logging

logger = logging.getLogger(__name__)


class Flow(WorkspaceRelated):
    name = models.CharField(max_length=255)
    app = models.ForeignKey(App, on_delete=models.CASCADE, related_name="flow")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    file = models.OneToOneField(File, on_delete=models.CASCADE, related_name="flow")

    def get_custom_action_url(self):
        url = reverse("admin:flow_runs_flowrun_add")
        query_string = urlencode({"flow": self.pk})
        return f"{url}?{query_string}"

    class Meta:
        unique_together = ["name", "workspace"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        self.name = os.path.basename(os.path.dirname(self.file.path))
        super().save(*args, **kwargs)
        flows_after_save(self)
