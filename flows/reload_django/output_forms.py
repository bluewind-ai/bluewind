from django import forms
from django_json_widget.widgets import JSONEditorWidget


class ReloadDjangoOutputForm(forms.Form):
    input = forms.JSONField(widget=JSONEditorWidget)
