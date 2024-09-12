from django import forms
from django.db import models
from encrypted_fields.fields import EncryptedCharField

from workspaces.models import WorkspaceRelated


class Credentials(WorkspaceRelated):
    key = models.CharField(max_length=255)
    value = EncryptedCharField(max_length=100000)

    def __str__(self):
        return f"{self.key} for workspace {self.workspace}"

    class Meta:
        verbose_name_plural = "Credentials"
        unique_together = ["workspace", "key"]


class CredentialsForm(forms.ModelForm):
    value = forms.CharField(
        widget=forms.Textarea(attrs={"rows": 10, "cols": 80}),
        max_length=100000,  # Increased to match the model field
    )

    class Meta:
        model = Credentials
        fields = ["workspace", "key", "value"]
