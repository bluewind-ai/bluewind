from django import forms
from django_json_widget.widgets import JSONEditorWidget


class ReloadGunicornOutputForm(forms.Form):
    input = forms.JSONField(widget=JSONEditorWidget)
