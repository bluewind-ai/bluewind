# function_calls/admin.py

import importlib
import json
import logging

from django import forms
from django.contrib import admin, messages
from django.http import JsonResponse
from django.shortcuts import redirect
from django.urls import reverse
from django.utils.safestring import mark_safe

from base_model_admin.admin import InWorkspace
from bluewind.context_variables import get_workspace_id
from functions.handle_query_params.v1.functions import handle_query_params_v1

from .models import FunctionCall

logger = logging.getLogger("django.not_used")


logger = logging.getLogger("django.not_used")


class OutputFormWidget(forms.Widget):
    def render(self, name, value, attrs=None, renderer=None):
        function_call = self.function_call
        function = function_call.function
        version = f"v{function.version_number}"
        module_name = (
            f"functions.{function.name_without_version}.{version}.output_forms"
        )
        class_name = (
            "".join(word.title() for word in function.name.split("_")) + "OutputForm"
        )

        form_module = importlib.import_module(module_name)
        FormClass = getattr(form_module, class_name)
        form = FormClass(initial=function_call.output_data)
        return mark_safe(form.as_p())


class FunctionCallForm(forms.ModelForm):
    rendered_output = forms.Field(widget=OutputFormWidget(), required=False)

    class Meta:
        model = FunctionCall
        fields = ["function"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["rendered_output"].label = "Rendered Output"
        self.fields["rendered_output"].widget.function_call = self.instance


@admin.register(FunctionCall)
class FunctionCallAdmin(InWorkspace):
    change_form_template = "admin/function_calls/functioncall/change_form.html"
    add_form_template = "admin/function_calls/functioncall/add_form.html"
    form = FunctionCallForm

    list_display = ["id", "function", "user", "status", "executed_at", "workspace"]
    list_filter = ["status", "function", "workspace"]
    search_fields = ["function__name", "user__username", "workspace__name"]
    ordering = ["-executed_at"]  # Most recent first

    readonly_fields = ["function", "status", "executed_at", "user", "workspace"]

    fieldsets = (
        (
            None,
            {
                "fields": (
                    "function",
                    "status",
                    "rendered_output",
                    "input_data",
                    "output_data",
                    "user",
                    "workspace",
                    "executed_at",
                )
            },
        ),
    )

    def has_change_permission(self, request, obj=None):
        logger.debug(f"Checking change permission for user: {request.user}")
        return True

    def get_actions(self, request):
        logger.debug("Getting actions for FunctionCallAdmin")
        return []

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if obj:
            form.base_fields["rendered_output"].widget.function_call = obj
        return form

    def save_model(self, request, obj, form, change):
        logger.debug(f"Save model called for object: {obj}, change: {change}")
        if change:
            logger.warning("Attempt to save changes to existing FunctionCall object")
            self.message_user(
                request,
                "Saving changes to FunctionCall objects is not permitted.",
                level=messages.ERROR,
            )
            return
        super().save_model(request, obj, form, change)

    def add_view(self, request):
        if request.GET.get("flow_mode"):
            function_call = FunctionCall.objects.create(
                flow=Flow.objects.get(name="toggle_flow_mode"),
                user_id=1,
                workspace_id=get_workspace_id(),
                status=FunctionCall.Status.RUNNING,
            )
            toggle_flow_mode(function_call)
            return JsonResponse({"status": "success"})

        logger.debug("Add view called for FunctionCallAdmin")
        function_call_id = request.GET.get("function")
        function_call = None

        if not function_call_id:
            real_flow = request.GET.get("real-flow")
            if real_flow:
                function_call = FunctionCall.objects.create(
                    flow=Flow.objects.get(name=real_flow),
                    user_id=1,
                    workspace_id=get_workspace_id(),
                    status=FunctionCall.Status.READY_FOR_APPROVAL,
                )
            else:
                raise ValueError("Missing 'flow' query parameter")
                logger.error("Missing 'flow' query parameter")
                self.message_user(
                    request, "Missing 'flow' query parameter.", level=messages.ERROR
                )
                return redirect(
                    reverse(
                        f"admin:{self.model._meta.app_label}_{self.model._meta.model_name}_changelist"
                    )
                )
        else:
            function_call = FunctionCall.objects.filter(id=function_call_id).first()
        logger.debug(f"Flow Run retrieved: {function_call}")

        if request.method == "POST":
            logger.debug("POST request received in add view")
            result = function_calls_create_view(request, function_call)
            if result:
                return result
            # If create_view returns None, fall through to rendering the form again

        context = self.admin_site.each_context(request)

        # Generate the graph
        build_function_calls_graph = FunctionCall.objects.create(
            flow=Flow.objects.get(name="build_function_calls_graph"),
            user_id=1,
            workspace_id=get_workspace_id(),
            status=FunctionCall.Status.READY_FOR_APPROVAL,
        )
        run_flow(build_function_calls_graph, {"function_call_1": function_call})
        if request.headers.get("X-Requested-With") == "XMLHttpRequest":
            return JsonResponse(forms.model_to_dict(build_function_calls_graph))
        # raise ValueError(forms.model_to_dict(build_function_calls_graph))
        # Add graph_data to the context
        context["graph_data"] = json.dumps(build_function_calls_graph.output_data)

        # Use TemplateResponse instead of directly calling function_calls_create_form
        return function_calls_create_form(
            request, function_call, self.add_form_template, context
        )

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
        flow = obj.function
        function_name = function.name
        class_name = "".join(word.title() for word in function_name.split("_"))
        module_name = f"functions.{function.name}.output_forms"

        try:
            form_module = importlib.import_module(module_name)
            FormClass = getattr(form_module, f"{class_name}OutputForm")
            return FormClass(initial=obj.output_data)
        except (ImportError, AttributeError) as e:
            logger.error(f"Failed to create output form: {e}")
            return None

    def change_view(self, request, object_id, form_url="", extra_context=None):
        handle_query_params_v1(query_params=request.GET, function_call_id=object_id)
        real_flow = request.GET.get("real_flow")
        if real_flow:
            if real_flow == "mark_function_call_as_successful":
                function_call_to_mark_as_successful = FunctionCall.objects.get(
                    id=object_id
                )
                flow_to_run = FunctionCall.objects.create(
                    flow=Flow.objects.get(name="mark_function_call_as_successful"),
                    user_id=1,
                    workspace_id=get_workspace_id(),
                    status=FunctionCall.Status.READY_FOR_APPROVAL,
                )
                run_flow(
                    flow_to_run,
                    {"function_call_1": function_call_to_mark_as_successful},
                )
                return redirect("/workspaces/1/admin/users")
            elif real_flow == "mark_function_call_as_failed":
                function_call_to_mark_as_failed = FunctionCall.objects.get(id=object_id)
                flow_to_run = FunctionCall.objects.create(
                    flow=Flow.objects.get(name="mark_function_call_as_failed"),
                    user_id=1,
                    workspace_id=get_workspace_id(),
                    status=FunctionCall.Status.READY_FOR_APPROVAL,
                )
                run_flow(
                    flow_to_run,
                    {"function_call_1": function_call_to_mark_as_failed},
                )
                return redirect("/workspaces/1/admin/users")
            else:
                raise ValueError(f"Invalid real-flow: {real_flow}")
        extra_context = extra_context or {}
        extra_context["custom_actions"] = self.get_custom_actions(request, object_id)
        return super().change_view(request, object_id, form_url, extra_context)

    # def get_form(self, request, obj=None, **kwargs):
    #     if obj and obj.status == "READY":
    #         return ReadyFunctionCallChangeForm
    #     return super().get_form(request, obj, **kwargs)

    def get_custom_actions(self, request, object_id):
        # Define your custom actions here
        return [
            {
                "name": "action1",
                "label": "Mark Flow Run as Successful",
                "title": "Mark Flow Run as Successful",
                "css_class": "button",
                "method": "get",
                "url": "?real_flow=mark_function_call_as_successful",
            },
            {
                "name": "action1",
                "label": "Mark Flow Run as Failed",
                "title": "Mark Flow Run as Failed",
                "css_class": "button",
                "method": "get",
                "url": "?real_flow=mark_function_call_as_failed",
            },
            {
                "name": "action3",
                "label": "Approve",
                "title": "Approve",
                "css_class": "button",
                "method": "get",
                "url": "?function=approve_function_call",
            },
        ]
