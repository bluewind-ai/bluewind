import importlib
import json
import logging

from django.template.response import TemplateResponse

logger = logging.getLogger("django.temp")


import logging

logger = logging.getLogger("django.temp")

# Adjusted flow_runs_change_form function

import logging

logger = logging.getLogger("django.temp")


import logging

logger = logging.getLogger("django.temp")


import logging

logger = logging.getLogger("django.temp")


def flow_runs_change_form(request, flow, obj, form_template, context):
    """
    Handles dynamic form generation and template rendering for FlowRun change view.
    """
    logger.debug(f"Creating form for flow: {flow.name}")
    function_name = flow.name
    class_name = "".join(word.title() for word in function_name.split("_"))
    module_name = f"flows.{flow.name}.output_forms"

    try:
        form_module = importlib.import_module(module_name)
    except ImportError as e:
        logger.error(f"Failed to import module {module_name}: {e}")
        return TemplateResponse(request, form_template, context)

    form_type = "output" if hasattr(obj, "output_data") else "input"
    form_class_name = (
        f"{class_name}OutputForm" if form_type == "output" else f"{class_name}Form"
    )

    try:
        FormClass = getattr(form_module, form_class_name)
    except AttributeError as e:
        logger.error(f"Form class {form_class_name} not found in {module_name}: {e}")
        return TemplateResponse(request, form_template, context)

    input_data = {}
    if form_type == "output" and obj.output_data:
        if isinstance(obj.output_data, str):
            try:
                input_data = json.loads(obj.output_data)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to decode output_data JSON: {e}")
        elif isinstance(obj.output_data, dict):
            input_data = obj.output_data

    custom_form = FormClass(initial=input_data)
    context["custom_form"] = custom_form

    logger.debug("Rendering template response")
    return TemplateResponse(request, form_template, context)
