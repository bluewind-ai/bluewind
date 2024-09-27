# function_calls/admin.py

import importlib
import logging
from urllib.parse import unquote

from django import forms
from django.contrib import admin, messages
from django.contrib.contenttypes.models import ContentType
from django.shortcuts import redirect
from django.template.response import TemplateResponse
from django.utils.safestring import mark_safe

from base_model_admin.admin import InWorkspace
from functions.handle_query_params.v1.functions import handle_query_params_v1

from .models import FunctionCall

logger = logging.getLogger("django.not_used")


logger = logging.getLogger("django.not_used")


class DummyDynamicForm(forms.Form):
    dynamic_field = forms.CharField(label="Dynamic Field", max_length=100)

    def __init__(self, *args, **kwargs):
        function_call = kwargs.pop("function_call", None)
        super().__init__(*args, **kwargs)

        if function_call:
            # Here you can add fields dynamically based on the function_call
            self.fields[f"custom_field_{function_call.id}"] = forms.CharField(
                label=f"Custom Field for Function Call {function_call.id}",
                initial={"key": "value"},
            )


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


@admin.register(FunctionCall)
class FunctionCallAdmin(InWorkspace):
    change_form_template = "admin/function_calls/functioncall/change_form.html"
    add_form_template = "admin/function_calls/functioncall/add_form.html"

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

    def change_view(self, request, object_id, form_url="", extra_context=None):
        redirect_response = handle_query_params_v1(
            query_params=request.GET, function_call_id=object_id
        )
        if redirect_response:
            return redirect_response
        object_id = unquote(object_id)

        function_call = self.get_object(request, object_id)

        if request.method == "POST":
            form = self.get_form(request, function_call, change=True)(
                request.POST, request.FILES, instance=function_call
            )
            custom_form = DummyDynamicForm(request.POST, function_call=function_call)
            if "_save_custom" in request.POST:
                if custom_form.is_valid():
                    # Process the custom form data
                    messages.success(request, "Custom form processed successfully")
                    return redirect(".")
            elif form.is_valid():
                self.save_model(request, function_call, form, change=True)
                messages.success(request, "Form processed successfully")
                return redirect(".")
        else:
            form = self.get_form(request, function_call, change=True)(
                instance=function_call
            )
            custom_form = DummyDynamicForm(function_call=function_call)

        context = {
            **self.admin_site.each_context(request),
            "title": f"Change Function Call: {function_call}",
            "form": form,
            "custom_form": custom_form,
            "object_id": object_id,
            "original": function_call,
            "is_popup": False,
            "to_field": None,
            "media": self.media,
            "inline_admin_formsets": [],
            "app_label": self.model._meta.app_label,
            "opts": self.model._meta,
            "add": False,
            "change": True,
            "has_view_permission": self.has_view_permission(request, function_call),
            "has_add_permission": self.has_add_permission(request),
            "has_change_permission": self.has_change_permission(request, function_call),
            "has_delete_permission": self.has_delete_permission(request, function_call),
            "has_editable_inline_admin_formsets": False,
            "has_file_field": True,
            "has_absolute_url": False,
            "form_url": form_url,
            "content_type_id": ContentType.objects.get_for_model(self.model).pk,
            "save_as": self.save_as,
            "save_on_top": self.save_on_top,
        }

        extra_context = extra_context or {}
        extra_context["custom_actions"] = self.get_custom_actions(request, object_id)
        context.update(extra_context)

        return TemplateResponse(request, self.change_form_template, context)

    # def get_form(self, request, obj=None, **kwargs):
    #     if obj and obj.status == "READY":
    #         return ReadyFunctionCallChangeForm
    #     return super().get_form(request, obj, **kwargs)

    def get_custom_actions(self, request, object_id):
        function_call = self.get_object(request, object_id)
        actions = [
            {
                "name": "action1",
                "label": "Mark Flow Run as Successful",
                "title": "Mark Flow Run as Successful",
                "css_class": "button",
                "method": "get",
                "url": "?real_flow=mark_function_call_as_successful",
            },
            {
                "name": "action2",
                "label": "Mark Flow Run as Failed",
                "title": "Mark Flow Run as Failed",
                "css_class": "button",
                "method": "get",
                "url": "?real_flow=mark_function_call_as_failed",
            },
        ]

        if function_call.status == FunctionCall.Status.READY_FOR_APPROVAL:
            actions.append(
                {
                    "name": "action3",
                    "label": "Approve",
                    "title": "Approve",
                    "css_class": "button",
                    "method": "get",
                    "url": "?function=approve_function_call",
                }
            )

        return actions
