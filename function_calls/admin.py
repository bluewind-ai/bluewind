from django import forms

from base_model_admin.admin import InWorkspace
from function_calls.models import FunctionCall


class FunctionCallForm(forms.ModelForm):
    custom_text = forms.CharField()

    class Meta:
        model = FunctionCall
        fields = [
            "status",
            "long_description",
            "custom_text",
        ]  # Include both status and the new custom field

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields[
            "custom_text"
        ].initial = "This is a custom text field added on the fly."

    def save(self, commit=True):
        # The custom_text field won't be saved to the model
        # You can process it here if needed
        instance = super().save(commit=False)
        custom_text = self.cleaned_data.get("custom_text")
        # Do something with custom_text if needed
        if commit:
            instance.save()
        return instance


class FunctionCallAdmin(InWorkspace):
    form = FunctionCallForm

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False  # Allow viewing, but saving will be prevented

    def has_delete_permission(self, request, obj=None):
        return False
