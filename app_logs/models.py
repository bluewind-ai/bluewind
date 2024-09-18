from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone

from incoming_http_requests.models import IncomingHTTPRequest
from workspaces.models import WorkspaceRelated


class AppLog(WorkspaceRelated):
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)

    timestamp = models.DateTimeField()
    level = models.CharField(max_length=10)
    incoming_http_request = models.ForeignKey(  # Changed field name
        IncomingHTTPRequest, on_delete=models.CASCADE
    )
    logger = models.CharField(max_length=100)
    message = models.TextField()
    traceback = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        indexes = [
            models.Index(fields=["incoming_http_request"]),  # Updated index
            models.Index(fields=["timestamp"]),
        ]
