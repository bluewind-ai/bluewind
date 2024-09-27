# without_admin.py

from urllib.parse import unquote

from django import forms
from django.contrib import messages
from django.shortcuts import get_object_or_404, redirect
from django.template.response import TemplateResponse

from functions.handle_query_params.v1.functions import (
    get_input_form,
)
from functions.master.v1.functions import master_v1

from .models import FunctionCall


class DummyDynamicForm(forms.Form):
    status = forms.CharField(label="Status", disabled=True, required=False)

    class Media:
        js = ("js/toggle_details.js",)

    def __init__(self, *args, **kwargs):
        function_call = kwargs.pop("function_call")
        input_form = get_input_form(function_call)

        super().__init__(*args, **kwargs)

        self.fields["status"].initial = function_call.status

        for field_name, field in input_form.fields.items():
            self.fields[field_name] = field
        self.detail_fields = ["status"]

    def get_main_fields(self):
        return [field for field in self.fields if field not in self.detail_fields]


def function_call_change_view(request, object_id=None):
    # raise NotImplementedError("This function is not implemented yet.")
    # redirect_response = handle_query_params_v1(
    #     query_params=request.GET, function_call_id=object_id
    # )
    # if redirect_response:
    #     return redirect_response
    if not object_id:
        return master_v1(None)
    else:
        object_id = unquote(object_id)
    function_call = get_object_or_404(FunctionCall, id=object_id)

    if request.method == "POST":
        custom_form = DummyDynamicForm(request.POST, function_call=function_call)
        if "_save_custom" in request.POST:
            if custom_form.is_valid():
                # Process the custom form data
                messages.success(request, "Custom form processed successfully")
                return redirect(".")
    else:
        custom_form = DummyDynamicForm(function_call=function_call)

    context = {
        "title": f"Change Function Call: {function_call}",
        "custom_form": custom_form,
        "custom_form_html": custom_form.as_p(),
        "object_id": object_id,
        "original": function_call,
        "custom_actions": get_custom_actions(request, function_call),
    }

    return TemplateResponse(
        request, "function_calls/functioncall/change_form.html", context
    )


def get_custom_actions(request, function_call):
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
