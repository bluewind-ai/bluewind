import importlib
import logging

from django.template.response import TemplateResponse

from bluewind.context_variables import get_workspace_id

logger = logging.getLogger("django.not_used")


def flow_runs_create_form(request, flow_run, add_form_template, context, form=None):
    logger.debug(f"Creating form for flow: {flow_run.flow.name}")
    function_name = flow_run.flow.name
    class_name = "".join(word.title() for word in function_name.split("_"))
    module_name = f"flows.{flow_run.flow.name}.input_forms"
    form_module = importlib.import_module(module_name)
    form_class_name = f"{class_name}Form"
    logger.debug(f"Looking for form class: {form_class_name}")
    FormClass = getattr(form_module, form_class_name)

    # Instantiate the form with any necessary arguments, such as 'workspace'
    form = FormClass(workspace=get_workspace_id())

    context.update(
        {
            "title": f"Run {flow_run.flow.name}",
            "form": form,
            "media": form.media,
        }
    )
    logger.debug("Rendering template response")
    return TemplateResponse(request, add_form_template, context)
