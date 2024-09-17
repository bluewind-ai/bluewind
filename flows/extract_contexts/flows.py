import logging

from django.template import Context, Template

logger = logging.getLogger("django.debug")


from django.utils.safestring import mark_safe


def extract_contexts(files):
    logger.debug(f"Extracting contexts for {len(files)} files")
    template_content = """
{% autoescape off %}
{% for file in files %}
File: {{ file.path }}
Content:
{{ file.content }}

{% endfor %}
{% endautoescape %}
"""
    logger.debug(f"Template content: {template_content}")

    template = Template(template_content)
    context = Context({"files": files})
    rendered_content = template.render(context)

    logger.debug(f"Rendered content: {rendered_content}")
    return {"extracted_contexts": mark_safe(rendered_content)}
