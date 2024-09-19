import logging

from django import forms

from daphne_processes.models import DaphneProcess

logger = logging.getLogger("django.debug")


class ReloadDaphneForm(forms.Form):
    daphne_process = forms.ModelChoiceField(
        queryset=DaphneProcess.objects.all(),
        # widget=forms.CheckboxSelectMultiple,
    )

    def __init__(self, *args, **kwargs):
        logger.debug("Initializing ExtractContextsForm")
        self.workspace = kwargs.pop("workspace", None)
        super().__init__(*args, **kwargs)
