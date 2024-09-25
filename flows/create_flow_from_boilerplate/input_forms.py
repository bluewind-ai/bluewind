import logging

from django import forms

from flows.models import Flow

logger = logging.getLogger("django.not_used")


class CreateFlowFromBoilerplateForm(forms.Form):
    flow_name = forms.CharField(initial="new_flow")
    flow_to_clone = forms.ModelChoiceField(
        queryset=Flow.objects.all(), initial=Flow.objects.first()
    )

    def __init__(self, *args, **kwargs):
        logger.debug("Initializing ExtractContextsForm")
        self.workspace = kwargs.pop("workspace", None)
        super().__init__(*args, **kwargs)
