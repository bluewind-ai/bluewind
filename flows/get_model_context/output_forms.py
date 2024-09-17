from django import forms


class GetModelContextOutputForm(forms.Form):
    model_context = forms.CharField(
        widget=forms.Textarea(
            attrs={
                "rows": 100,
                "cols": 100,
                "class": "form-control",
                "placeholder": "Enter the extracted contexts here...",
                # Keep the existing styles
                "style": "resize: none; overflow: hidden; min-height: 100px; font-family: monospace;",
            }
        ),
    )
