import requests

from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from workspaces.models import WorkspaceRelated


class APICall(WorkspaceRelated):
    url = models.URLField()
    method = models.CharField(
        max_length=10,
        choices=[
            ("GET", "GET"),
            ("POST", "POST"),
            ("PUT", "PUT"),
            ("DELETE", "DELETE"),
        ],
        default="GET",
    )
    headers = models.JSONField(default=dict, blank=True)
    data = models.JSONField(null=True, blank=True)
    response = models.TextField(blank=True)
    status_code = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.method} {self.url}"


@receiver(post_save, sender=APICall)
def execute_api_call(sender, instance, created, **kwargs):
    if created:
        try:
            response = requests.request(
                method=instance.method,
                url=instance.url,
                headers=instance.headers,
                json=instance.data,
            )
            instance.response = response.text
            instance.status_code = response.status_code
            instance.save()
        except Exception as e:
            instance.response = str(e)
            instance.save()
