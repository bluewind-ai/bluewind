import logging

from base_model_admin.admin import InWorkspace
from django.db import models
from django.urls import reverse
from django.utils.html import format_html
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


class DraftMessageAdmin(InWorkspace):
    # list_display = ["sender", "recipient_link", "subject", "updated_at"]
    # list_filter = ["sender", "updated_at"]
    # search_fields = ["subject", "content"]

    def recipient_link(self, obj):
        url = reverse("admin:people_person_change", args=[obj.recipient.id])
        return format_html('<a href="{}">{}</a>', url, obj.recipient)
