import logging

from base_model_admin.admin import InWorkspace
from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from gmail_events.models import gmail_webhook

logger = logging.getLogger(__name__)


# Register your models here.
class GmailEventAdmin(InWorkspace):
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
