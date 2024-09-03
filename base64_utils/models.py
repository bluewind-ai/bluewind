import base64

from base_model_admin.admin import InWorkspace
from django import forms
from django.db import models
from workspaces.models import WorkspaceRelated


class Base64Conversion(WorkspaceRelated):
    input_text = models.TextField()
    output_text = models.TextField()
    operation = models.CharField(
        max_length=10,
        choices=[("encode", "Encode to Base64"), ("decode", "Decode from Base64")],
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Base64 Conversion"
        verbose_name_plural = "Base64 Conversions"

    def __str__(self):
        return f"{self.operation} at {self.created_at}"


class Base64ConversionForm(forms.ModelForm):
    class Meta:
        model = Base64Conversion
        fields = ["input_text", "operation"]

    def clean(self):
        cleaned_data = super().clean()
        input_text = cleaned_data.get("input_text")
        operation = cleaned_data.get("operation")

        try:
            if operation == "encode":
                output_text = base64.b64encode(input_text.encode()).decode()
            else:
                output_text = base64.b64decode(input_text).decode()
            cleaned_data["output_text"] = output_text
        except Exception as e:
            raise forms.ValidationError(f"Error in base64 {operation}: {str(e)}")

        return cleaned_data


class Base64ConversionAdmin(InWorkspace):
    form = Base64ConversionForm

    def save_model(self, request, obj, form, change):
        obj.output_text = form.cleaned_data["output_text"]
        super().save_model(request, obj, form, change)
