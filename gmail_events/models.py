import base64
import json
import logging

from django.db import models
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt

from channels.models import Channel, fetch_messages_from_gmail
from gmail_events.after_create import gmail_events_after_create
from gmail_events.after_update import gmail_events_after_update
from gmail_events.before_create import gmail_events_before_create
from gmail_events.before_update import gmail_events_before_update
from workspaces.models import WorkspaceRelated

logger = logging.getLogger(__name__)


@csrf_exempt
def gmail_webhook(request):
    payload = json.loads(request.body)
    message_data = payload.get("message", {})
    data = json.loads(base64.b64decode(message_data.get("data", "")).decode("utf-8"))
    email_address = data.get("emailAddress")

    try:
        channel = Channel.objects.get(email=email_address)
    except Channel.DoesNotExist:
        logger.warning(f"Received webhook for non-existent channel: {email_address}")
        return HttpResponse(
            "Channel not found", status=200
        )  # Return 200 to acknowledge receipt

    # Proceed with existing logic for valid channels
    history_id = data.get("historyId")
    created_count = fetch_messages_from_gmail(channel, history_id)
    return HttpResponse(f"Processed {created_count} messages", status=200)


class GmailEvent(WorkspaceRelated):
    timestamp = models.DateTimeField(auto_now_add=True)
    event_data = models.JSONField()

    def __str__(self):
        return f"Gmail Event at {self.timestamp}"

    class Meta:
        app_label = "gmail_events"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        if is_new:
            gmail_events_before_create(self)
        else:
            gmail_events_before_update(self)
        super().save(*args, **kwargs)
        if is_new:
            gmail_events_after_create(self)
        else:
            gmail_events_after_update(self)
