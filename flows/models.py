import logging
from urllib.parse import urlencode

from django.db import models
from django.urls import reverse

from flows.after_create import flows_after_create
from flows.after_update import flows_after_update
from flows.before_create import flows_before_create
from flows.before_update import flows_before_update
from workspaces.models import WorkspaceRelated

logger = logging.getLogger(__name__)

logger = logging.getLogger(__name__)


logger = logging.getLogger(__name__)


class Flow(WorkspaceRelated):
    name = models.CharField(max_length=255)
    app = models.ForeignKey("apps.App", on_delete=models.CASCADE, related_name="flow")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    file = models.OneToOneField(
        "files.File", on_delete=models.CASCADE, related_name="flow"
    )

    def get_custom_action_url(self):
        url = reverse("admin:flow_runs_flowrun_add")
        query_string = urlencode({"flow": self.pk})
        return f"{url}?{query_string}"

    class Meta:
        unique_together = ["name", "workspace"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        if is_new:
            flows_before_create(self)
        else:
            flows_before_update(self)
        super().save(*args, **kwargs)
        if is_new:
            flows_after_create(self)
        else:
            flows_after_update(self)
