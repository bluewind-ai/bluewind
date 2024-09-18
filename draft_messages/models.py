import logging

from django.db import models

from workspaces.models import WorkspaceRelated

logger = logging.getLogger(__name__)


class DraftMessage(WorkspaceRelated):
    from channels.models import Channel
    from people.models import Person

    channel = models.ForeignKey(
        Channel, on_delete=models.CASCADE, related_name="draft_messages"
    )
    recipient = models.ForeignKey(
        Person, on_delete=models.CASCADE, related_name="received_draft_messages"
    )
    sender = models.ForeignKey(
        Person, on_delete=models.CASCADE, related_name="draft_messages"
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    subject = models.CharField(max_length=255, blank=True, null=True)
    gmail_draft_id = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        unique_together = ["workspace", "gmail_draft_id"]

    def __str__(self):
        return f"Draft: {self.subject}: {self.content[:50]}"
