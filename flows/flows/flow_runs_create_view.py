# flow_runs/admin.py
import importlib

from django.contrib import messages
from django.contrib.contenttypes.models import ContentType
from django.shortcuts import redirect
from django.urls import reverse
from django.utils import timezone
from django.utils.html import escape

from bluewind.context_variables import get_workspace_id
from flow_runs.models import FlowRun


def flow_runs_create_view(request, flow):
    module_name = f"flows.flows.{flow.name}"
    flow_module = importlib.import_module(module_name)
    function_name = flow.name
    snake_function_name = "".join(word.title() for word in function_name.split("_"))
    form_class_name = f"{snake_function_name}Form"
    FormClass = getattr(flow_module, form_class_name)
    function_to_run = getattr(flow_module, function_name)

    form = FormClass(request.POST)
    if form.is_valid():
        content_type = form.cleaned_data.get("content_type")
        result = function_to_run(content_type=content_type)

        input_data = form.cleaned_data.copy()
        if isinstance(content_type, ContentType):
            input_data["content_type"] = content_type.natural_key()

        flow_run = FlowRun(
            user=request.user,
            workspace_id=get_workspace_id(),
            input_data=input_data,
            result=result,
            executed_at=timezone.now(),
            flow=flow,
        )
        flow_run.save()

        messages.info(request, f"Flow Result:\n{escape(result)}")
        return redirect(reverse("admin:flow_runs_flowrun_changelist"))
    return None
