import logging

from django import forms

logger = logging.getLogger("django.debug")

# flows/extract_contexts/input_forms.py (same file as above)


class ExtractContextsOutputForm(forms.Form):
    extracted_contexts = forms.CharField(
        widget=forms.Textarea,
        help_text="The extracted contexts from the files.",
    )
