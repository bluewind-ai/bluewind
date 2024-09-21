import logging

from django import forms
from django.contrib.contenttypes.models import ContentType

logger = logging.getLogger("django.not_used")


class GetModelContextForm(forms.Form):
    content_type = forms.ModelChoiceField(queryset=ContentType.objects.all())

    def __init__(self, *args, **kwargs):
        logger.debug("Initializing ExtractContextsForm")
        self.workspace = kwargs.pop("workspace", None)
        super().__init__(*args, **kwargs)
