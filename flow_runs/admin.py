# flow_runs/admin.py

import importlib
import logging

from django import forms
from django.contrib import admin, messages
from django.shortcuts import redirect
from django.urls import reverse
from django.utils.safestring import mark_safe

from base_model_admin.admin import InWorkspace
from flows.flow_runs_create_form.flows import flow_runs_create_form
from flows.flow_runs_create_view.flows import flow_runs_create_view
from flows.models import Flow  # Adjust import based on your project structure

from .models import FlowRun

logger = logging.getLogger("django.debug")


logger = logging.getLogger("django.debug")


class OutputFormWidget(forms.Widget):
    def render(self, name, value, attrs=None, renderer=None):
        flow_run = self.flow_run
        flow = flow_run.flow
        module_name = f"flows.{flow.name}.output_forms"
        class_name = (
            "".join(word.title() for word in flow.name.split("_")) + "OutputForm"
        )

        form_module = importlib.import_module(module_name)
        FormClass = getattr(form_module, class_name)
        form = FormClass(initial=flow_run.output_data)
        return mark_safe(form.as_p())


class FlowRunForm(forms.ModelForm):
    rendered_output = forms.Field(widget=OutputFormWidget(), required=False)

    class Meta:
        model = FlowRun
        fields = [
            "rendered_output",
            "input_data",
            "output_data",
            "user",
            "workspace",
            "flow",
            "executed_at",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["rendered_output"].label = "Rendered Output"
        self.fields["rendered_output"].widget.flow_run = self.instance


@admin.register(FlowRun)
class FlowRunAdmin(InWorkspace):
    add_form_template = "admin/flow_runs/flowrun/add_form.html"
    form = FlowRunForm

    def has_change_permission(self, request, obj=None):
        logger.debug(f"Checking change permission for user: {request.user}")
        return True

    def get_actions(self, request):
        logger.debug("Getting actions for FlowRunAdmin")
        return []

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if obj:
            form.base_fields["rendered_output"].widget.flow_run = obj
        return form

    def save_model(self, request, obj, form, change):
        logger.debug(f"Save model called for object: {obj}, change: {change}")
        if change:
            logger.warning("Attempt to save changes to existing FlowRun object")
            self.message_user(
                request,
                "Saving changes to FlowRun objects is not permitted.",
                level=messages.ERROR,
            )
            return
        super().save_model(request, obj, form, change)

    def add_view(self, request):
        logger.debug("Add view called for FlowRunAdmin")
        flow_id = request.GET.get("flow")
        if not flow_id:
            logger.error("Missing 'flow' query parameter")
            self.message_user(
                request, "Missing 'flow' query parameter.", level=messages.ERROR
            )
            return redirect(
                reverse(
                    f"admin:{self.model._meta.app_label}_{self.model._meta.model_name}_changelist"
                )
            )

        flow = Flow.objects.get(pk=flow_id)
        logger.debug(f"Flow retrieved: {flow}")

        if request.method == "POST":
            logger.debug("POST request received in add view")
            result = flow_runs_create_view(request, flow)
            if result:
                return result
            # If create_view returns None, fall through to rendering the form again

        context = self.admin_site.each_context(request)
        return flow_runs_create_form(request, flow, self.add_form_template, context)

    # def get_form(self, request, obj=None, **kwargs):
    #     form = super().get_form(request, obj, **kwargs)
    #     if obj and obj.output_data:
    #         output_form = self.get_output_form(obj)
    #         if output_form:
    #             form.base_fields["output_data"].widget = forms.Widget()
    #             form.base_fields["output_data"].widget.render = (
    #                 lambda name, value, attrs=None, renderer=None: output_form.as_p()
    #             )
    #     return form

    def get_output_form(self, obj):
        flow = obj.flow
        function_name = flow.name
        class_name = "".join(word.title() for word in function_name.split("_"))
        module_name = f"flows.{flow.name}.output_forms"

        try:
            form_module = importlib.import_module(module_name)
            FormClass = getattr(form_module, f"{class_name}OutputForm")
            return FormClass(initial=obj.output_data)
        except (ImportError, AttributeError) as e:
            logger.error(f"Failed to create output form: {e}")
            return None
