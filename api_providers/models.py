from django.db import models
from base_model.models import BaseModel
from bluewind.utils import uuid7

class ApiProvider(BaseModel):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name

class ApiKey(BaseModel):
    content = models.TextField()
    provider = models.ForeignKey(ApiProvider, on_delete=models.CASCADE, related_name='api_keys')

    def __str__(self):
        return f"API Key for {self.provider.name}"