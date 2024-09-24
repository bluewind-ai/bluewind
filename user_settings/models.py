# Create your models here.
from django.contrib.auth import get_user_model
from django.db import models


class UserSettings(models.Model):
    class Mode(models.TextChoices):
        FLOW = "flow", "Flow"
        MANUAL = "manual", "Manual"

    user = models.OneToOneField(
        get_user_model(), on_delete=models.CASCADE, related_name="settings"
    )

    mode = models.CharField(max_length=10, choices=Mode.choices, default=Mode.FLOW)

    def __str__(self):
        return f"{self.user.username}'s settings"
