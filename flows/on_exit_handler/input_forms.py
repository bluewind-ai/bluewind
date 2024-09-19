import logging

from django import forms

from gunicorn_instances.models import GunicornInstance

logger = logging.getLogger("django.debug")


class ReloadGunicornForm(forms.Form):
    gunicorn_instance = forms.ModelChoiceField(
        queryset=GunicornInstance.objects.all(),
        widget=forms.CheckboxSelectMultiple,
        help_text="Select the files to include in the template",
    )

    def __init__(self, *args, **kwargs):
        logger.debug("Initializing ExtractContextsForm")
        self.workspace = kwargs.pop("workspace", None)
        super().__init__(*args, **kwargs)
