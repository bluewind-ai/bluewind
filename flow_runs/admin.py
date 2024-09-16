# flow_runs/admin.py
import importlib

from django.contrib import admin, messages
from django.contrib.contenttypes.models import ContentType
from django.shortcuts import redirect
from django.template.response import TemplateResponse
from django.urls import reverse
from django.utils import timezone
from django.utils.html import escape

from base_model_admin.admin import InWorkspace
from bluewind.context_variables import get_workspace_id
from flows.models import Flow  # Adjust import based on your project structure

from .models import FlowRun


@admin.register(FlowRun)
class FlowRunAdmin(InWorkspace):
    add_form_template = "admin/flow_runs/flowrun/add_form.html"
    change_form_template = "admin/change_form.html"

    def has_change_permission(self, request, obj=None):
        return True

    def get_readonly_fields(self, request, obj=None):
        if obj:
            return [field.name for field in self.model._meta.fields]
        return self.readonly_fields

    def get_actions(self, request):
        return []

    def change_view(self, request, object_id, form_url="", extra_context=None):
        if request.method == "POST":
            self.message_user(
                request,
                "Changes to FlowRun objects are not allowed.",
                level=messages.ERROR,
            )
            return redirect(
                reverse(
                    f"admin:{self.model._meta.app_label}_{self.model._meta.model_name}_changelist"
                )
            )

        return super().change_view(request, object_id, form_url, extra_context)

    def save_model(self, request, obj, form, change):
        if change:
            self.message_user(
                request,
                "Saving changes to FlowRun objects is not permitted.",
                level=messages.ERROR,
            )
            return
        super().save_model(request, obj, form, change)

    def add_view(self, request, form_url="", extra_context=None):
        flow_id = request.GET.get("flow")
        if not flow_id:
            self.message_user(
                request, "Missing 'flow' query parameter.", level=messages.ERROR
            )
            return redirect(
                reverse(
                    f"admin:{self.model._meta.app_label}_{self.model._meta.model_name}_changelist"
                )
            )

        flow = Flow.objects.get(pk=flow_id)

        module_name = f"flows.flows.{flow.name}"
        flow_module = importlib.import_module(module_name)

        function_name = flow.name
        snake_function_name = "".join(word.title() for word in function_name.split("_"))
        form_class_name = f"{snake_function_name}Form"

        FormClass = getattr(flow_module, form_class_name)
        function_to_run = getattr(flow_module, function_name)

        if request.method == "POST":
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
                return redirect(
                    reverse(
                        f"admin:{self.model._meta.app_label}_{self.model._meta.model_name}_changelist"
                    )
                )
        else:
            form = FormClass()

        context = {
            **self.admin_site.each_context(request),
            "title": f"Run {flow.name}",
            "form": form,
            "media": self.media + form.media,
            "opts": self.model._meta,
            "app_label": self.model._meta.app_label,
            "add": True,
            "change": False,
            "has_view_permission": self.has_view_permission(request),
            "has_add_permission": self.has_add_permission(request),
            "has_change_permission": False,
            "has_delete_permission": self.has_delete_permission(request),
        }

        return TemplateResponse(request, self.add_form_template, context)
