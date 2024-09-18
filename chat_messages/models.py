import logging

from django.db import models

from chat_messages.after_create import chat_messages_after_create
from chat_messages.after_update import chat_messages_after_update
from chat_messages.before_create import chat_messages_before_create
from chat_messages.before_update import chat_messages_before_update
from workspaces.models import WorkspaceRelated

logger = logging.getLogger(__name__)


class Message(WorkspaceRelated):
    from channels.models import Channel
    from people.models import Person

    channel = models.ForeignKey(
        Channel, on_delete=models.CASCADE, related_name="sent_messages"
    )
    recipient = models.ForeignKey(
        Person, on_delete=models.CASCADE, related_name="received_messages"
    )
    sender = models.ForeignKey(
        Person, on_delete=models.CASCADE, related_name="messages"
    )
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    subject = models.CharField(max_length=255, blank=True, null=True)
    gmail_message_id = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        unique_together = ["workspace", "gmail_message_id"]

    def __str__(self):
        return f"{self.subject}: {self.content[:50]}"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        if is_new:
            chat_messages_before_create(self)
        else:
            chat_messages_before_update(self)
        super().save(*args, **kwargs)
        if is_new:
            chat_messages_after_create(self)
        else:
            chat_messages_after_update(self)
