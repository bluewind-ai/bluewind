from django import forms
from django.http import HttpRequest
from django.utils.translation import gettext_lazy as _

from base_model_admin.admin import InWorkspace
from domain_names.models import DomainName
from function_calls.admin import new_method
from unfold.decorators import action


class DomainNameForm(forms.ModelForm):
    class Meta:
        model = DomainName
        fields = ["name", "function_call", "user"]


class DomainNameAdmin(InWorkspace):
    form = DomainNameForm
    actions_detail = ["restart"]

    # def get_actions_detail(self, request, obj=None):
    #     return super().get_actions_detail(request, obj)

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

    @action(
        description=_("Restart"),
        url_path="restart",
    )
    def restart(self, request: HttpRequest, object_id: int):
        context = self.admin_site.each_context(request)

        return new_method(request, context)
