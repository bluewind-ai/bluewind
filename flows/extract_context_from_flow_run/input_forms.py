import logging

from django import forms

logger = logging.getLogger("django.not_used")


class ExtractContextFromFlowRunForm(forms.Form):
    issue = forms.CharField(help_text="What was the issue?")

    def __init__(self, *args, **kwargs):
        logger.debug("Initializing ExtractContextsForm")
        self.workspace = kwargs.pop("workspace", None)
        super().__init__(*args, **kwargs)
