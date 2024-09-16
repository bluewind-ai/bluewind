import importlib
import logging

from django.template.response import TemplateResponse

logger = logging.getLogger("django.debug")


def flow_runs_create_form(request, flow, add_form_template, context, form=None):
    logger.debug(f"Creating form for flow: {flow.name}")
    module_name = f"flows.flows.{flow.name}"
    logger.debug(f"Importing module: {module_name}")
    flow_module = importlib.import_module(module_name)
    function_name = flow.name
    snake_function_name = "".join(word.title() for word in function_name.split("_"))
    form_class_name = f"{snake_function_name}Form"
    logger.debug(f"Looking for form class: {form_class_name}")
    FormClass = getattr(flow_module, form_class_name)
    form = FormClass()

    context = {
        **context,
        "title": f"Run {flow.name}",
        "form": form,
        "media": form.media,
    }
    logger.debug("Rendering template response")
    return TemplateResponse(request, add_form_template, context)
