from django.db import models
from bluewind.utils import uuid7

class ApiProvider(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid7, editable=False)
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name

class ApiKey(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid7, editable=False)
    content = models.TextField()
    provider = models.ForeignKey(ApiProvider, on_delete=models.CASCADE, related_name='api_keys')

    def __str__(self):
        return f"API Key for {self.provider.name}"