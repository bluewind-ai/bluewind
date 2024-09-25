import logging

from django import forms

from flow_runs.models import FlowRun

logger = logging.getLogger("django.not_used")


class MarkFlowRunAsSuccessfulForm(forms.Form):
    flow_run_1 = forms.ModelChoiceField(
        queryset=FlowRun.objects.all(), initial=FlowRun.objects.first()
    )

    def __init__(self, *args, **kwargs):
        logger.debug("Initializing ExtractContextsForm")
        self.workspace = kwargs.pop("workspace", None)
        super().__init__(*args, **kwargs)
