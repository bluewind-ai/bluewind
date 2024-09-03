from encrypted_fields.fields import EncryptedCharField

from base_model_admin.admin import InWorkspace
from django import forms
from django.contrib import admin
from django.db import models
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
    is_base64 = forms.BooleanField(
        required=False,
        help_text="Check this to convert the value to Base64 before saving.",
    )
    value = forms.CharField(
        widget=forms.Textarea(attrs={"rows": 10, "cols": 80}),
        max_length=100000,  # Increased to match the model field
    )

    class Meta:
        model = Credentials
        fields = ["workspace", "key", "value", "is_base64"]


@admin.register(Credentials)
class CredentialsAdmin(InWorkspace):
    form = CredentialsForm

    def save_model(self, request, obj, form, change):
        if form.cleaned_data.get("is_base64"):
            # Add your Base64 conversion logic here if needed
            pass
        super().save_model(request, obj, form, change)
