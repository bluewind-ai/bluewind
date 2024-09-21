import logging

from django import forms

from daphne_processes.models import DaphneProcess

logger = logging.getLogger("django.not_used")


class ReloadGunicornForm(forms.Form):
    daphne_process = forms.ModelChoiceField(
        queryset=DaphneProcess.objects.all(),
        widget=forms.CheckboxSelectMultiple,
        help_text="Select the files to include in the template",
    )

    def __init__(self, *args, **kwargs):
        logger.debug("Initializing ExtractContextsForm")
        self.workspace = kwargs.pop("workspace", None)
        super().__init__(*args, **kwargs)
