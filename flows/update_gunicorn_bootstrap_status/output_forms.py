from django import forms
from django_json_widget.widgets import JSONEditorWidget


class UpdateGunicornBootstrapStatusOutputForm(forms.Form):
    output = forms.JSONField(widget=JSONEditorWidget)
