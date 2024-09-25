import logging

from django import forms
from django_json_widget.widgets import JSONEditorWidget

logger = logging.getLogger("django.not_used")


class GenerateGraphOutputForm(forms.Form):
    input = forms.JSONField(widget=JSONEditorWidget)

    def __init__(self, *args, **kwargs):
        logger.debug("Initializing ExtractContextsForm")
        self.workspace = kwargs.pop("workspace", None)
        super().__init__(*args, **kwargs)
