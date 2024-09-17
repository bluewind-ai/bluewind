import importlib
import json
import logging

from django.template.response import TemplateResponse

logger = logging.getLogger("django.debug")


import logging

logger = logging.getLogger("django.debug")

# Adjusted flow_runs_change_form function

import logging

logger = logging.getLogger("django.debug")


import logging

logger = logging.getLogger("django.debug")


import logging

logger = logging.getLogger("django.debug")


def flow_runs_change_form(request, flow, obj, form_template, context):
    """
    Handles dynamic form generation and template rendering for FlowRun change view.
    """
    logger.debug(f"Creating form for flow: {flow.name}")
    function_name = flow.name
    class_name = "".join(word.title() for word in function_name.split("_"))
    module_name = f"flows.{flow.name}.output_forms"  # Ensure correct module name

    try:
        form_module = importlib.import_module(module_name)
    except ImportError as e:
        logger.error(f"Failed to import module {module_name}: {e}")
        raise

    # Determine form type based on the object's data
    form_type = "output" if hasattr(obj, "output_data") else "input"
    form_class_name = (
        f"{class_name}Form" if form_type == "input" else f"{class_name}OutputForm"
    )

    logger.debug(f"Looking for form class: {form_class_name}")
    try:
        FormClass = getattr(form_module, form_class_name)
    except AttributeError as e:
        logger.error(f"Form class {form_class_name} not found in {module_name}: {e}")
        raise

    # Ensure input_data is a dictionary
    input_data = {}
    if form_type == "output":
        if isinstance(obj.output_data, str):
            try:
                input_data = json.loads(
                    obj.output_data
                )  # Convert JSON string to dictionary
            except json.JSONDecodeError as e:
                logger.error(f"Failed to decode output_data JSON: {e}")
                input_data = {}
        elif isinstance(obj.output_data, dict):
            input_data = obj.output_data

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
