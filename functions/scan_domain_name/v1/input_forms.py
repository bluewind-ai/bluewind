import logging

from django import forms

logger = logging.getLogger("django.not_used")


class ScanDomainNameV1Form(forms.Form):
    domain_name = forms.CharField()

    def __init__(self, *args, **kwargs):
        logger.debug("Initializing ExtractContextsForm")
        self.workspace = kwargs.pop("workspace", None)
        super().__init__(*args, **kwargs)
