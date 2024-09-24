# flow_runs/admin.py
import importlib

from django.contrib import messages
from django.contrib.contenttypes.models import ContentType
from django.core.serializers.json import DjangoJSONEncoder
from django.db.models.query import QuerySet
from django.shortcuts import redirect
from django.template.response import TemplateResponse
from django.urls import reverse

from flows.run_flow.flows import run_flow


class CustomJSONEncoder(DjangoJSONEncoder):
    def default(self, obj):
        if isinstance(obj, ContentType):
            return obj.natural_key()
        if isinstance(obj, QuerySet):
            return list(obj)  # This will evaluate the queryset
        return super().default(obj)


def flow_runs_create_view(request, flow):
    function_name = flow.name
    snake_function_name = "".join(word.title() for word in function_name.split("_"))
    form_module_name = f"flows.{flow.name}.input_forms"
    form_module = importlib.import_module(form_module_name)
    form_class_name = f"{snake_function_name}Form"
    FormClass = getattr(form_module, form_class_name)

    form = FormClass(request.POST)
    if form.is_valid():
        input_data = form.cleaned_data.copy()

        flow_run = run_flow(flow, request.user, input_data)
        return redirect("/workspaces/1/admin/users")

        return redirect(reverse("admin:flow_runs_flowrun_change", args=[flow_run.id]))
    else:
        messages.error(request, "Form is not valid.")
    context = {
        "form": form,
        "title": f"Run {flow.name}",
        "media": form.media,
        # Include any other context variables needed by your template
    }
    return redirect("workspaces/1/admin/whatever")
    return TemplateResponse(request, "admin/flow_runs/flowrun/add_form.html", context)
