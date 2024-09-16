from django import forms
from django.template import Context, Template

from files.models import File


class FileSelectionForm(forms.Form):
    files = forms.ModelMultipleChoiceField(
        queryset=File.objects.all(),
        widget=forms.CheckboxSelectMultiple,
        help_text="Select the files to include in the template",
    )

    def __init__(self, *args, **kwargs):
        self.workspace = kwargs.pop("workspace", None)
        super().__init__(*args, **kwargs)
        if self.workspace:
            self.fields["files"].queryset = File.objects.filter(
                workspace=self.workspace
            )


def extract_contexts(selected_files):
    template_content = """
{% for file in files %}
File: {{ file.path }}
Content:
{{ file.content }}

{% endfor %}
"""
    return Template(template_content)


def get_rendered_template(form):
    if form.is_valid():
        selected_files = form.cleaned_data["files"]
        template = generate_template(selected_files)
        context = {"files": selected_files}
        return template.render(Context(context))
    return None
