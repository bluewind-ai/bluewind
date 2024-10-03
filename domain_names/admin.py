import json
from typing import Union

from django import forms
from django.http import HttpRequest
from django.shortcuts import redirect
from django.utils.translation import gettext_lazy as _

from base_model_admin.admin import InWorkspace
from bluewind.context_variables import set_function, set_function_call
from domain_names.models import DomainName
from function_calls.admin import get_function_call_whole_tree_v1
from function_calls.models import FunctionCall
from functions.approve_function_call.v1.functions import approve_function_call_v1
from functions.go_next.v1.functions import go_next_v1
from unfold.decorators import action


class DomainNameForm(forms.ModelForm):
    class Meta:
        model = DomainName
        fields = ["name", "function_call", "user"]
        # widgets = {
        #     "function_call": forms.HiddenInput(),
        #     "workspace": forms.HiddenInput(),
        #     "user": forms.HiddenInput(),
        # }


class DomainNameAdmin(InWorkspace):
    form = DomainNameForm
    actions_detail = [
        "approve_function_call",
    ]
    actions_submit_line = ["changeform_submitline_action"]

    def get_actions_detail(self, request, obj=None):
        actions = super().get_actions_detail(request, obj)
        return actions

    def get_changeform_initial_data(self, request):
        initial = super().get_changeform_initial_data(request)
        function_call_id = request.GET.get("function_call")
        if function_call_id:
            initial["function_call"] = function_call_id
        return initial

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if obj is None:  # This is an add form
            function_call_id = request.GET.get("function_call")
            if function_call_id:
                form.base_fields["function_call"].initial = function_call_id
        return form

    def add_view(self, request, form_url="", extra_context=None):
        function_call_id = None
        function_call_to_approve = None
        request_post = request.POST
        if request_post:
            function_call_id = request_post.get("function_call")

            if function_call_id:
                function_call_to_approve = FunctionCall.objects.filter(
                    status=FunctionCall.Status.READY_FOR_APPROVAL
                ).first()

                set_function(function_call_to_approve.function)
                set_function_call(function_call_to_approve)
        else:
            extra_context = self.get_add_view(request, extra_context)

        response = super().add_view(request, form_url, extra_context)

        if not response.status_code == 302:
            return response
        if function_call_to_approve:
            return redirect(
                f"/function_calls/functioncall/{function_call_to_approve.id}/change"
            )
        return response

    def get_add_view(self, request, extra_context=None):
        request_get = request.GET
        if request_get:
            function_call_id = request_get.get("function_call")
            if not function_call_id:
                return extra_context

            extra_context = extra_context or {}
            _, tree_data = get_function_call_whole_tree_v1(function_call_id)
            extra_context["tree_json"] = json.dumps(tree_data)
            return extra_context
        return extra_context

    @action(
        description=_("Approve"),
        url_path="approve_function_call",
    )
    def approve_function_call(self, request: HttpRequest, object_id: int):
        approve_function_call_v1(function_call_id=object_id)
        context = self.admin_site.each_context(request)
        return go_next_v1(request, context)

    @action(
        description=_("Changeform submitline action"),
        permissions=["changeform_submitline_action"],
    )
    def changeform_submitline_action(self, request: HttpRequest, obj: int):
        """
        If instance is modified in any way, it also needs to be saved, since this handler is invoked after instance is saved.
        """
        approve_function_call_v1(function_call_id=obj.function_call_id)
        context = self.admin_site.each_context(request)

        obj.save()
        return go_next_v1(request, context)

    def has_changeform_submitline_action_permission(
        self, request: HttpRequest, object_id: Union[str, int] = None
    ):
        return True
