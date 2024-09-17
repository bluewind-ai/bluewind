# flow_runs/admin.py

import importlib
import json
import logging

from django.contrib import admin, messages
from django.shortcuts import redirect
from django.template.response import TemplateResponse
from django.urls import reverse

from base_model_admin.admin import InWorkspace
from flows.models import Flow  # Adjust import based on your project structure

from .models import FlowRun

logger = logging.getLogger("django.debug")


logger = logging.getLogger("django.debug")


@admin.register(FlowRun)
class FlowRunAdmin(InWorkspace):
    add_form_template = "admin/flow_runs/flowrun/add_form.html"
    change_form_template = "admin/flow_runs/flowrun/change_form.html"

    def has_change_permission(self, request, obj=None):
        logger.debug(f"Checking change permission for user: {request.user}")
        return True

    def get_actions(self, request):
        logger.debug("Getting actions for FlowRunAdmin")
        return []

    def change_view(self, request, object_id, form_url="", extra_context=None):
        logger.debug(f"Change view called for object_id: {object_id}")
        obj = self.get_object(request, object_id)
        if obj is None:
            return self._get_obj_does_not_exist_redirect(
                request, self.model._meta, object_id
            )

        if request.method == "POST":
            logger.warning("POST request received in change view, redirecting")
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

        # Prepare context for the template
        context = {
            **self.admin_site.each_context(request),
            "opts": self.model._meta,
        }

        # Dynamic form generation logic
        flow = obj.flow
        logger.debug(f"Creating form for flow: {flow.name}")
        function_name = flow.name
        class_name = "".join(word.title() for word in function_name.split("_"))
        module_name = f"flows.{flow.name}.output_forms"

        try:
            form_module = importlib.import_module(module_name)
        except ImportError as e:
            logger.error(f"Failed to import module {module_name}: {e}")
            raise

        form_type = "output" if hasattr(obj, "output_data") else "input"
        form_class_name = (
            f"{class_name}Form" if form_type == "input" else f"{class_name}OutputForm"
        )

        logger.debug(f"Looking for form class: {form_class_name}")
        try:
            FormClass = getattr(form_module, form_class_name)
        except AttributeError as e:
            logger.error(
                f"Form class {form_class_name} not found in {module_name}: {e}"
            )
            raise

        # Ensure input_data is a dictionary
        input_data = {}
        if form_type == "output":
            if isinstance(obj.output_data, str):
                try:
                    input_data = json.loads(obj.output_data)
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to decode output_data JSON: {e}")
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

        return TemplateResponse(request, self.change_form_template, context)

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
