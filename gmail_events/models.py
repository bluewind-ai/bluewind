import json
import logging

from base_model.models import BaseModel
from bluewind.admin_site import custom_admin_site
from django.contrib import admin
from django.db import models
from django.http import HttpResponse
from django.urls import path
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

logger = logging.getLogger(__name__)


# Model definition
class GmailEvent(BaseModel):
    timestamp = models.DateTimeField(auto_now_add=True)
    event_data = models.JSONField()

    def __str__(self):
        return f"Gmail Event at {self.timestamp}"

    class Meta:
        app_label = "gmail_events"


# Admin and webhook definition
class GmailEventAdmin(admin.ModelAdmin):
    list_display = ("timestamp",)

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "gmail-webhook/",
                self.admin_site.admin_view(self.gmail_webhook),
                name="gmail_webhook",
            ),
        ]
        return custom_urls + urls

    @method_decorator(csrf_exempt)
    def gmail_webhook(self, request):
        if request.method == "POST":
            try:
                event_data = json.loads(request.body)
                logger.info(f"Received Gmail event: {event_data}")
                print(
                    f"Received Gmail event: {event_data}"
                )  # This will print to console/logs

                # Optionally, save the event to the database
                GmailEvent.objects.create(event_data=event_data)

                return HttpResponse("Event received", status=200)
            except json.JSONDecodeError:
                logger.error("Invalid JSON received in Gmail webhook")
                return HttpResponse("Invalid JSON", status=400)
        else:
            return HttpResponse("Method not allowed", status=405)


custom_admin_site.register(GmailEvent, GmailEventAdmin)
