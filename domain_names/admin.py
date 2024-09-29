from django import forms
from django.shortcuts import redirect

from base_model_admin.admin import InWorkspace
from domain_names.models import DomainName
from function_calls.models import FunctionCall
from functions.serialize_form_data.v1.functions import serialize_form_data_v1


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
        if request.POST:
            # raise Exception(request.POST)
            form = self.get_form(request)(request.POST)
            serialized_data = serialize_form_data_v1(form)

            function_call = FunctionCall.objects.filter(
                status=FunctionCall.Status.READY_FOR_APPROVAL
            ).first()

            super().add_view(request, form_url, extra_context)
            return redirect(
                f"/workspaces/2/admin/function_calls/functioncall/{function_call.id}/change"
            )
        else:
            return super().add_view(request, form_url, extra_context)


# def handle_function_call_after_save_v1(object):
#     with transaction.atomic():
#         output_form_data = object.function_call.output_form_data
#         output_form_data.data = {"domain_name": 1}
#         output_form_data.save()
#         FunctionCall.objects.filter(input_form_data=output_form_data).update(
#             status=FunctionCall.Status.READY_FOR_APPROVAL
#         )
#         object.function_call.status = FunctionCall.Status.COMPLETED
#         object.function_call.save()
#         form_class = import_form_using_db_object_v1(output_form_data)
#         if form_class(data={"name": 1}).is_valid():
#             raise Exception("Form is valid")
#         else:
#             raise Exception(
#                 f"Form is invalid: {form_class(data={'domain_name': 1}).errors}"
#             )
