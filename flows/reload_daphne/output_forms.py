from django import forms
from django_json_widget.widgets import JSONEditorWidget


class ReloadDaphneOutputForm(forms.Form):
    input = forms.JSONField(widget=JSONEditorWidget)
