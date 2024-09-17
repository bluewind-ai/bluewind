from django import forms
from django.contrib.contenttypes.models import ContentType


class GetModelContextForm(forms.Form):
    content_type = forms.ModelChoiceField(queryset=ContentType.objects.all())

    def __init__(self, *args, **kwargs):
        self.instance = kwargs.pop("instance", None)
        super().__init__(*args, **kwargs)
