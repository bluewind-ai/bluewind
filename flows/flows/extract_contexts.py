import logging

from django import forms

from files.models import File

logger = logging.getLogger("django.temp")


class ExtractContextsForm(forms.Form):
    files = forms.ModelMultipleChoiceField(
        queryset=File.objects.all(),
        widget=forms.CheckboxSelectMultiple,
        help_text="Select the files to include in the template",
    )

    def __init__(self, *args, **kwargs):
        logger.debug("Initializing ExtractContextsForm")
        self.workspace = kwargs.pop("workspace", None)
        super().__init__(*args, **kwargs)
        if self.workspace:
            logger.debug(f"Filtering files for workspace: {self.workspace}")
            self.fields["files"].queryset = File.objects.filter(
                workspace=self.workspace
            )


def extract_contexts(files):
    logger.debug(f"Extracting contexts for {len(files)} files")
    template_content = """
{% for file in files %}
File: {{ file.path }}
Content:
{{ file.content }}

{% endfor %}
"""
    return template_content
