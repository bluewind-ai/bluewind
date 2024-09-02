import base64
import json
import logging

from base_model.models import BaseModel
from bluewind.admin_site import custom_admin_site
from channels.models import Channel, fetch_messages_from_gmail
from django.contrib import admin
from django.db import models
from django.http import HttpResponse
from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from webhook_tester.models import log_incoming_webhook

logger = logging.getLogger(__name__)


@csrf_exempt
@log_incoming_webhook
def gmail_webhook(request):
    payload = json.loads(request.body)
    message_data = payload["message"]
    encoded_data = message_data["data"]

    decoded_data = base64.b64decode(encoded_data).decode("utf-8")
    data = json.loads(decoded_data)

    email_address = data["emailAddress"]
    history_id = data["historyId"]

    channel = Channel.objects.get(email=email_address)
    created_count = fetch_messages_from_gmail(channel, history_id=history_id)
    return HttpResponse(f"Processed {created_count} messages")


class GmailEvent(BaseModel):
    timestamp = models.DateTimeField(auto_now_add=True)
    event_data = models.JSONField()

    def __str__(self):
        return f"Gmail Event at {self.timestamp}"

    class Meta:
        app_label = "gmail_events"


class GmailEventAdmin(admin.ModelAdmin):
    list_display = ("timestamp",)

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "gmail-webhook/",
                csrf_exempt(gmail_webhook),
                name="gmail_webhook",
            ),
        ]
        return custom_urls + urls


custom_admin_site.register(GmailEvent, GmailEventAdmin)
