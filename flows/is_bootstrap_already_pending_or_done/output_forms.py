from django import forms
from django_json_widget.widgets import JSONEditorWidget


class IsBootstrapAlreadyPendingOrDoneOutputForm(forms.Form):
    output = forms.JSONField(widget=JSONEditorWidget)
