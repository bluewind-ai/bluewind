from django import forms
from django_json_widget.widgets import JSONEditorWidget


class IsWorkspaceBootstrapAlreadyPendingOrDoneOutputForm(forms.Form):
    output = forms.JSONField(widget=JSONEditorWidget)
