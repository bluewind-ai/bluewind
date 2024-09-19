from django import forms
from django_json_widget.widgets import JSONEditorWidget


class UpdateWorksspaceBootstrapStatusOutputForm(forms.Form):
    output = forms.JSONField(widget=JSONEditorWidget)
