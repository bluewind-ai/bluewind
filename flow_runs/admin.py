# flow_runs/admin.py

import logging

from django.contrib import admin, messages
from django.shortcuts import redirect
from django.urls import reverse

from base_model_admin.admin import InWorkspace
from flows.flow_runs_change_form.flows import flow_runs_change_form
from flows.flow_runs_create_form.flows import flow_runs_create_form
from flows.flow_runs_create_view.flows import flow_runs_create_view
from flows.models import Flow  # Adjust import based on your project structure

from .models import FlowRun

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
        obj = self.get_object(request, object_id)
        if obj is None:
            return self._get_obj_does_not_exist_redirect(
                request, self.model._meta, object_id
            )

        context = {
            **self.admin_site.each_context(request),
            "opts": self.model._meta,
            "add": False,
            "change": True,
            "is_popup": False,
            "save_as": False,
            "has_delete_permission": self.has_delete_permission(request, obj),
            "has_add_permission": self.has_add_permission(request),
            "has_change_permission": self.has_change_permission(request, obj),
            "has_view_permission": self.has_view_permission(request, obj),
            "has_editable_inline_admin_formsets": False,
            "title": f"View {self.model._meta.verbose_name}",
            "object_id": object_id,
        }

        return flow_runs_change_form(
            request, obj.flow, obj, self.change_form_template, context
        )

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
