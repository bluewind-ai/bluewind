import logging
from urllib.parse import urlencode

from django.db import models
from django.urls import reverse

from workspaces.models import WorkspaceRelated

logger = logging.getLogger(__name__)

logger = logging.getLogger(__name__)


class Flow(WorkspaceRelated):
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_custom_action_url(self):
        url = reverse("admin:flow_runs_flowrun_add")
        query_string = urlencode({"flow": self.pk})
        return f"{url}?{query_string}"

    class Meta:
        unique_together = ["name", "workspace"]

    def __str__(self):
        return self.name
