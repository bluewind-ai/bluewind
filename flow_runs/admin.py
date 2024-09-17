# flow_runs/admin.py

import importlib
import json
import logging

from django import forms
from django.contrib import admin, messages
from django.shortcuts import redirect
from django.template.response import TemplateResponse
from django.urls import reverse

from base_model_admin.admin import InWorkspace
from flows.flow_runs_create_form.flows import flow_runs_create_form
from flows.flow_runs_create_view.flows import flow_runs_create_view
from flows.models import Flow  # Adjust import based on your project structure

from .models import FlowRun

logger = logging.getLogger("django.debug")


logger = logging.getLogger("django.debug")


class OutputFormWidget(forms.Widget):
    def render(self, name, value, attrs=None, renderer=None):
        return value if value else ""


class CustomFlowRunForm(forms.ModelForm):
    rendered_output = forms.Field(widget=OutputFormWidget(), required=False)

    class Meta:
        model = FlowRun
        fields = [
            "rendered_output",
            "user",
            "workspace",
            "flow",
            "executed_at",
            "input_data",
            "output_data",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["rendered_output"].label = "Rendered Output"
        self.fields["output_data"].widget = forms.Textarea(
            attrs={"readonly": "readonly"}
        )


@admin.register(FlowRun)
class FlowRunAdmin(InWorkspace):
    add_form_template = "admin/flow_runs/flowrun/add_form.html"
    change_form_template = (
        "admin/change_form.html"  # Use the default change form template
    )

    def has_change_permission(self, request, obj=None):
        logger.debug(f"Checking change permission for user: {request.user}")
        return True

    def get_actions(self, request):
        logger.debug("Getting actions for FlowRunAdmin")
        return []

    from django.views.debug import ExceptionReporter

    def change_view(self, request, object_id, form_url="", extra_context=None):
        logger.debug(f"Change view called for object_id: {object_id}")
        try:
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
                "change": True,
                "add": False,
                "is_popup": False,
                "save_as": False,
                "has_add_permission": self.has_add_permission(request),
                "has_change_permission": self.has_change_permission(request, obj),
                "has_view_permission": self.has_view_permission(request, obj),
                "has_delete_permission": self.has_delete_permission(request, obj),
                "has_editable_inline_admin_formsets": False,
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

            form_class_name = f"{class_name}OutputForm"

            logger.debug(f"Looking for form class: {form_class_name}")
            try:
                FormClass = getattr(form_module, form_class_name)
            except AttributeError as e:
                logger.error(
                    f"Form class {form_class_name} not found in {module_name}: {e}"
                )
                raise

            # Ensure output_data is a dictionary
            output_data = {}
            if isinstance(obj.output_data, str):
                try:
                    output_data = json.loads(obj.output_data)
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to decode output_data JSON: {e}")
            elif isinstance(obj.output_data, dict):
                output_data = obj.output_data

            # Instantiate the output form with initial data
            output_form = FormClass(initial=output_data)

            # Instantiate the custom form
            form = CustomFlowRunForm(
                instance=obj,
                initial={
                    "rendered_output": output_form.as_p(),
                    "user": obj.user,
                    "workspace": obj.workspace,
                    "flow": obj.flow,
                    "executed_at": obj.executed_at,
                    "input_data": obj.input_data,
                    "output_data": obj.output_data,
                },
            )

            context.update(
                {
                    "title": f"Flow Run: {flow.name}",
                    "form": form,
                    "media": form.media,
                }
            )
            logger.debug("Rendering template response")

            # Debug print
            logger.debug(f"Context keys: {context.keys()}")

            return TemplateResponse(
                request,
                self.change_form_template
                or [
                    f"admin/{self.model._meta.app_label}/{self.model._meta.model_name}/change_form.html",
                    f"admin/{self.model._meta.app_label}/change_form.html",
                    "admin/change_form.html",
                ],
                context,
            )
        except Exception as e:
            logger.exception("An error occurred in change_view")
            if settings.DEBUG:
                reporter = ExceptionReporter(
                    request,
                    is_email=False,
                    exc_type=type(e),
                    exc_value=e,
                    tb=e.__traceback__,
                )
                html = reporter.get_traceback_html()
                return HttpResponse(html, content_type="text/html")
            else:
                raise  # Re-raise the exception in production

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

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if obj and obj.output_data:
            output_form = self.get_output_form(obj)
            if output_form:
                form.base_fields["output_data"].widget = forms.Widget()
                form.base_fields["output_data"].widget.render = (
                    lambda name, value, attrs=None, renderer=None: output_form.as_p()
                )
        return form

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
