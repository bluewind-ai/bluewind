import json
import logging
from functools import wraps

import requests

from base_model.models import BaseModel
from base_model_admin.models import BaseAdmin
from django import forms
from django.contrib import messages
from django.db import models
from django.http import HttpResponse
from django.shortcuts import redirect, render
from django.urls import path
from django.views.decorators.csrf import csrf_exempt

logger = logging.getLogger(__name__)


def log_incoming_webhook(func):
    @wraps(func)
    def wrapper(request, *args, **kwargs):
        IncomingWebhook.objects.create(
            headers=dict(request.headers),
            payload=json.loads(request.body) if request.body else {},
            method=request.method,
            ip_address=request.META.get("REMOTE_ADDR"),
        )
        return func(request, *args, **kwargs)

    return wrapper


# Model definitions
class WebhookTest(BaseModel):
    timestamp = models.DateTimeField(auto_now_add=True)
    webhook_url = models.URLField()
    payload = models.JSONField()

    def __str__(self):
        return f"Webhook Test at {self.timestamp}"

    class Meta:
        app_label = "webhook_tester"


class IncomingWebhook(BaseModel):
    timestamp = models.DateTimeField(auto_now_add=True)
    headers = models.JSONField()
    payload = models.JSONField()
    method = models.CharField(max_length=10)
    ip_address = models.GenericIPAddressField()

    def __str__(self):
        return f"Incoming Webhook at {self.timestamp}"

    class Meta:
        app_label = "webhook_tester"


# Form definition
class WebhookTestForm(forms.Form):
    webhook_url = forms.URLField(label="Webhook URL")
    payload = forms.JSONField(widget=forms.Textarea)
    actions = ["test_webhook_action"]


# Admin definitions
class WebhookTestAdmin(BaseAdmin):
    actions = ["test_webhook_action"]

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "test-webhook/",
                self.admin_site.admin_view(self.test_webhook_view),
                name="test_webhook",
            ),
            path(
                "webhook-results/",
                self.admin_site.admin_view(self.webhook_results_view),
                name="webhook_results",
            ),
            path(
                "dummy-webhook/",
                csrf_exempt(dummy_webhook),
                name="dummy_webhook",
            ),
        ]
        return custom_urls + urls

    def test_webhook_action(self, request, queryset):
        for webhook_test in queryset:
            try:
                headers = {
                    "Referer": request.build_absolute_uri(),
                }

                response = requests.post(
                    webhook_test.webhook_url, json=webhook_test.payload, headers=headers
                )
                webhook_test.response_status = response.status_code
                webhook_test.response_content = response.text
                webhook_test.save()
                self.message_user(
                    request,
                    f"Webhook {webhook_test.id} tested. Status: {response.status_code}",
                    messages.SUCCESS,
                )
            except requests.RequestException as e:
                self.message_user(
                    request,
                    f"Error testing webhook {webhook_test.id}: {str(e)}",
                    messages.ERROR,
                )

    test_webhook_action.short_description = "Test selected webhooks"

    def test_webhook_view(self, request):
        if request.method == "POST":
            form = WebhookTestForm(request.POST)
            if form.is_valid():
                webhook_url = form.cleaned_data["webhook_url"]
                payload = form.cleaned_data["payload"]

                try:
                    response = requests.post(webhook_url, json=payload)
                    WebhookTest.objects.create(
                        webhook_url=webhook_url,
                        payload=payload,
                        response_status=response.status_code,
                        response_content=response.text,
                    )
                    self.message_user(
                        request, f"Webhook tested. Status: {response.status_code}"
                    )
                except requests.RequestException as e:
                    self.message_user(
                        request, f"Error testing webhook: {str(e)}", level="ERROR"
                    )

                return redirect("..")
        else:
            form = WebhookTestForm()

        return render(request, "admin/webhook_tester/test_form.html", {"form": form})

    def webhook_results_view(self, request):
        tests = WebhookTest.objects.all().order_by("-timestamp")
        return render(request, "admin/webhook_tester/results.html", {"tests": tests})


class IncomingWebhookAdmin(BaseAdmin):
    list_display = ("timestamp", "method", "ip_address")
    readonly_fields = ("timestamp", "headers", "payload", "method", "ip_address")

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


# Register with custom admin site
# custom_admin_site.register(WebhookTest, WebhookTestAdmin)
# custom_admin_site.register(IncomingWebhook, IncomingWebhookAdmin)


@csrf_exempt
@log_incoming_webhook
def dummy_webhook(request):
    logger.info(f"Received {request.method} request to dummy webhook")
    if request.method in ["POST", "GET", "PUT", "DELETE"]:
        try:
            payload = json.loads(request.body) if request.body else {}
            headers = dict(request.headers)

            logger.info(f"Headers: {headers}")
            logger.info(f"Payload: {payload}")

            IncomingWebhook.objects.create(
                headers=headers,
                payload=payload,
                method=request.method,
                ip_address=request.META.get("REMOTE_ADDR"),
            )

            logger.info("Webhook data saved successfully")
            return HttpResponse("Webhook received and logged", status=200)
        except json.JSONDecodeError:
            logger.error("Invalid JSON received")
            return HttpResponse("Invalid JSON", status=400)
    logger.warning(f"Method {request.method} not allowed")
    return HttpResponse("Method not allowed", status=405)


# URLs (include these in your main urls.py)
# urlpatterns = [
#     path(
#         "admin/webhook-tester/webhooktest/test-webhook/",
#         WebhookTestAdmin.test_webhook_view,
#         name="test_webhook",
#     ),
#     path(
#         "admin/webhook-tester/webhooktest/webhook-results/",
#         WebhookTestAdmin.webhook_results_view,
#         name="webhook_results",
#     ),
#     path("admin/webhook_tester/webhooktest/dummy-webhook/", dummy_webhook, name="dummy_webhook"),
# ]
