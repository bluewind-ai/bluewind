import importlib
import logging

from django.template.response import TemplateResponse

logger = logging.getLogger("django.temp")


import logging

logger = logging.getLogger("django.temp")

# Adjusted flow_runs_change_form function

import logging

logger = logging.getLogger("django.temp")


def flow_runs_change_form(
    request, flow, input_data, form_template, context, form_type="input"
):
    logger.debug(f"Creating form for flow: {flow.name}")
    function_name = flow.name
    class_name = "".join(word.title() for word in function_name.split("_"))
    module_name = f"flows.{flow.name}.input_forms"
    form_module = importlib.import_module(module_name)
    if form_type == "input":
        form_class_name = f"{class_name}Form"
    elif form_type == "output":
        form_class_name = f"{class_name}OutputForm"
    else:
        raise ValueError(f"Unknown form_type: {form_type}")
    logger.debug(f"Looking for form class: {form_class_name}")
    FormClass = getattr(form_module, form_class_name)

    # Instantiate the form with initial data
    form = FormClass(initial=input_data)

    context.update(
        {
            "title": f"Flow Run: {flow.name}",
            "form": form,
            "media": form.media,
        }
    )
    logger.debug("Rendering template response")
    return TemplateResponse(request, form_template, context)
