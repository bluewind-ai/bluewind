import json
import logging

from django.template import Context, Template

from flow_runs.models import FlowRun

logger = logging.getLogger("django.not_used")  # noqa: F821


def handle_failed_flow_run(flow_run, issue, flow_run_1, django_models, flows):
    template_string = """
Django Models:
{% for model in django_models %}
{% if model.file.content %}
--- Model {{ model.id }} ---
{{ model.file.content|safe }}

{% endif %}
{% endfor %}

Flows:
{% for flow in flows %}
{% if flow.file.content %}
--- Flow {{ flow.id }} ---
{{ flow.file.content|safe }}

{% endif %}
{% endfor %}

Input Data:
{{ flow_run_1_input_data|safe }}

Output Data:
{{ flow_run_1_output_data|safe }}
"""

    # Pretty print the input and output data
    flow_run_1_input_data = (
        json.dumps(flow_run_1.input_data, indent=2) if flow_run_1.input_data else "None"
    )
    flow_run_1_output_data = (
        json.dumps(flow_run_1.output_data, indent=2)
        if flow_run_1.output_data
        else "None"
    )

    template = Template(template_string)
    context = Context(
        {
            "django_models": django_models,
            "flows": flows,
            "flow_run_1_input_data": flow_run_1_input_data,
            "flow_run_1_output_data": flow_run_1_output_data,
            "issue": issue,
        }
    )

    rendered_template = template.render(context)

    flow_run.status = FlowRun.Status.COMPLETED_READY_FOR_APPROVAL
    return {"context": rendered_template}
