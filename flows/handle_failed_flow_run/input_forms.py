import logging

from django import forms

from flow_runs.models import FlowRun
from flows.models import Flow
from models.models import Model

logger = logging.getLogger("django.not_used")


class HandleFailedFlowRunForm(forms.Form):
    issue = forms.CharField(help_text="What was the issue?")
    django_models = forms.ModelMultipleChoiceField(
        queryset=Model.objects.all(),
        widget=forms.CheckboxSelectMultiple,
        help_text="Select the files to include in the template",
    )
    flows = forms.ModelMultipleChoiceField(
        queryset=Flow.objects.all(),
        widget=forms.CheckboxSelectMultiple,
        help_text="Select the files to include in the template",
    )
    flow_run_1 = forms.ModelChoiceField(
        queryset=FlowRun.objects.all(), initial=Flow.objects.first()
    )

    def __init__(self, *args, **kwargs):
        logger.debug("Initializing ExtractContextsForm")
        self.workspace = kwargs.pop("workspace", None)
        super().__init__(*args, **kwargs)
