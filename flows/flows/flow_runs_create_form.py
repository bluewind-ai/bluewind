import importlib

from django.template.response import TemplateResponse


def flow_runs_create_form(request, flow, add_form_template, context, media, form=None):
    if form is None:
        module_name = f"flows.flows.{flow.name}"
        flow_module = importlib.import_module(module_name)
        function_name = flow.name
        snake_function_name = "".join(word.title() for word in function_name.split("_"))
        form_class_name = f"{snake_function_name}Form"
        FormClass = getattr(flow_module, form_class_name)
        form = FormClass()

    context = {
        **context,
        "title": f"Run {flow.name}",
        "form": form,
        "media": media + form.media,
    }

    return TemplateResponse(request, add_form_template, context)
