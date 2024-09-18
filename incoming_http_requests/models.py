from django.db import models

from incoming_http_requests.after_create import incoming_http_requests_after_create
from incoming_http_requests.after_update import incoming_http_requests_after_update
from incoming_http_requests.before_create import incoming_http_requests_before_create
from incoming_http_requests.before_update import incoming_http_requests_before_update
from workspaces.models import WorkspaceRelated


class IncomingHTTPRequest(WorkspaceRelated):
    id = models.AutoField(primary_key=True)

    def __str__(self):
        return f"IncomingHTTPRequest {self.id}"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        if is_new:
            incoming_http_requests_before_create(self)
        else:
            incoming_http_requests_before_update(self)
        super().save(*args, **kwargs)
        if is_new:
            incoming_http_requests_after_create(self)
        else:
            incoming_http_requests_after_update(self)
