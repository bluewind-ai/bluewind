# flows/extract_contexts/input_forms.py (same file as above)


from django import forms


class ExtractContextsOutputForm(forms.Form):
    extracted_contexts = forms.CharField(
        widget=forms.Textarea,
        help_text="The extracted contexts from the files.",
    )
