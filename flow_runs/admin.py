# flow_runs/admin.py

import logging

from django.contrib import admin, messages
from django.shortcuts import redirect
from django.urls import reverse

from base_model_admin.admin import InWorkspace
from flows.flows.flow_runs_create_form import flow_runs_create_form
from flows.flows.flow_runs_create_view import flow_runs_create_view
from flows.models import Flow  # Adjust import based on your project structure

from .models import FlowRun

logger = logging.getLogger("django.debug")


@admin.register(FlowRun)
class FlowRunAdmin(InWorkspace):
    add_form_template = "admin/flow_runs/flowrun/add_form.html"
    change_form_template = "admin/change_form.html"

    def has_change_permission(self, request, obj=None):
        logger.debug(f"Checking change permission for user: {request.user}")
        return True

    def get_readonly_fields(self, request, obj=None):
        logger.debug(f"Getting readonly fields for object: {obj}")
        if obj:
            return [field.name for field in self.model._meta.fields]
        return self.readonly_fields

    def get_actions(self, request):
        logger.debug("Getting actions for FlowRunAdmin")
        return []

    def change_view(self, request, object_id, form_url="", extra_context=None):
        logger.debug(f"Change view called for object_id: {object_id}")
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

        return super().change_view(request, object_id, form_url, extra_context)

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
