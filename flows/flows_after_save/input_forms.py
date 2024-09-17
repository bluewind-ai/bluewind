import logging

from django import forms

from flows.models import Flow

logger = logging.getLogger("django.debug")


class FlowsAfterSaveForm(forms.Form):
    flow = forms.ModelChoiceField(
        queryset=Flow.objects.all(),
        widget=forms.Select,
        help_text="Select the file to include in the template",
    )

    def __init__(self, *args, **kwargs):
        logger.debug("Initializing FunctionsAfterSaveForm")
        self.workspace = kwargs.pop("workspace", None)
        super().__init__(*args, **kwargs)
