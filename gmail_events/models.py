import base64
import json
import logging

from base_model.models import BaseModel
from channels.models import Channel, fetch_messages_from_gmail
from django.db import models
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from webhook_tester.models import log_incoming_webhook

logger = logging.getLogger(__name__)


@csrf_exempt
@log_incoming_webhook
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


class GmailEvent(BaseModel):
    timestamp = models.DateTimeField(auto_now_add=True)
    event_data = models.JSONField()

    def __str__(self):
        return f"Gmail Event at {self.timestamp}"

    class Meta:
        app_label = "gmail_events"
