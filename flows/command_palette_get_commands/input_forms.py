from django import forms


class CommandPaletteGetCommandsForm(forms.Form):
    def __init__(self, *args, **kwargs):
        self.instance = kwargs.pop("instance", None)
        super().__init__(*args, **kwargs)
