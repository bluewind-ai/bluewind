from django import forms
from django.shortcuts import redirect

from base_model_admin.admin import InWorkspace
from domain_names.models import DomainName
from function_calls.models import FunctionCall


class DomainNameForm(forms.ModelForm):
    class Meta:
        model = DomainName
        fields = ["name", "function_call", "workspace", "user"]
        # widgets = {
        #     "function_call": forms.HiddenInput(),
        #     "workspace": forms.HiddenInput(),
        #     "user": forms.HiddenInput(),
        # }


class DomainNameAdmin(InWorkspace):
    form = DomainNameForm
    list_display = ("name", "workspace")
    search_fields = ("name",)
    list_filter = ("workspace",)

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
        response = super().add_view(request, form_url, extra_context)
        if not response.status_code == 302:
            return response
        request_post = request.POST
        if not request_post:
            return response
        function_call_id = request_post.get("function_call")
        if not function_call_id:
            return response
        function_to_approve = FunctionCall.objects.filter(
            status=FunctionCall.Status.READY_FOR_APPROVAL
        ).first()
        if not function_to_approve:
            raise Exception("No function to approve")
        return redirect(
            f"/workspaces/1/admin/function_calls/functioncall/{function_to_approve.id}/change"
        )
