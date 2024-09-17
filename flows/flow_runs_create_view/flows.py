# flow_runs/admin.py
import importlib
import json

from django.contrib import messages
from django.contrib.contenttypes.models import ContentType
from django.core.serializers.json import DjangoJSONEncoder
from django.db.models.query import QuerySet
from django.shortcuts import redirect
from django.template.response import TemplateResponse
from django.urls import reverse
from django.utils import timezone

from bluewind.context_variables import get_workspace_id
from flow_runs.models import FlowRun


class CustomJSONEncoder(DjangoJSONEncoder):
    def default(self, obj):
        if isinstance(obj, ContentType):
            return obj.natural_key()
        if isinstance(obj, QuerySet):
            return list(obj.values_list("pk", flat=True))
        return super().default(obj)


def flow_runs_create_view(request, flow):
    flow_module_name = f"flows.{flow.name}.flows"
    flow_module = importlib.import_module(flow_module_name)
    function_name = flow.name
    snake_function_name = "".join(word.title() for word in function_name.split("_"))

    form_module_name = f"flows.{flow.name}.input_forms"
    form_module = importlib.import_module(form_module_name)
    form_class_name = f"{snake_function_name}Form"

    FormClass = getattr(form_module, form_class_name)
    function_to_run = getattr(flow_module, function_name)

    form = FormClass(request.POST)
    if form.is_valid():
        input_data = form.cleaned_data.copy()

        serialized_input = json.dumps(input_data, cls=CustomJSONEncoder)
        parsed_input = json.loads(serialized_input)
        executed_at = timezone.now()
        try:
            result = function_to_run(**input_data)
        except Exception as e:
            flow_run = FlowRun(
                user=request.user,
                workspace_id=get_workspace_id(),
                input_data=parsed_input,
                output_data=str(e),
                executed_at=executed_at,
                flow=flow,
            )
            raise e

        flow_run = FlowRun(
            user=request.user,
            workspace_id=get_workspace_id(),
            input_data=parsed_input,
            output_data=result,
            executed_at=executed_at,
            flow=flow,
        )
        flow_run.save()

        return redirect(reverse("admin:flow_runs_flowrun_change", args=[flow_run.id]))
    else:
        messages.error(request, "Form is not valid.")
    context = {
        "form": form,
        "title": f"Run {flow.name}",
        "media": form.media,
        # Include any other context variables needed by your template
    }
    return TemplateResponse(request, "admin/flow_runs/flowrun/add_form.html", context)
