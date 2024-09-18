from django.db import models

from workspaces.models import WorkspaceRelated


class IncomingHTTPRequest(WorkspaceRelated):
    id = models.AutoField(primary_key=True)

    def __str__(self):
        return f"IncomingHTTPRequest {self.id}"
