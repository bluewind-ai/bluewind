from django import forms
from django_json_widget.widgets import JSONEditorWidget


class CommandPaletteGetCommandsOutputForm(forms.Form):
    commands = forms.JSONField(widget=JSONEditorWidget)
