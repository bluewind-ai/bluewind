import logging

from django import forms

logger = logging.getLogger("django.not_used")


class HandleFailedFlowRunOutputForm(forms.Form):
    context = forms.CharField(
        widget=forms.Textarea(attrs={"rows": 5, "cols": 40}),
    )

    def __init__(self, *args, **kwargs):
        logger.debug("Initializing ExtractContextsForm")
        self.workspace = kwargs.pop("workspace", None)
        super().__init__(*args, **kwargs)