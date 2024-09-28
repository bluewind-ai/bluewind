from django import forms
from django.contrib import admin
from django.http import HttpRequest
from django.utils.translation import gettext_lazy as _

from base_model_admin.admin import InWorkspace
from function_calls.models import FunctionCall
from functions.handle_query_params.v1.functions import handle_query_params_v1
from unfold.decorators import action


class FunctionCallForm(forms.ModelForm):
    class Meta:
        model = FunctionCall
        fields = [
            "thoughts",
            "status",
            "function",
            "state",
            "user",
            "workspace",
            "input_data",
            "executed_at",
            "parent",
        ]


@admin.register(FunctionCall)
class FunctionCallAdmin(InWorkspace, admin.ModelAdmin):
    form = FunctionCallForm
    actions_detail = ["accept_function_call"]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False  # Allow viewing, but saving will be prevented

    def has_delete_permission(self, request, obj=None):
        return False

    @action(
        description=_("Accept"),
        url_path="retry-function-call",
    )
    def accept_function_call(self, request: HttpRequest, object_id: int):
        return handle_query_params_v1(function_call_id=object_id)

    def has_retry_function_call_permission(self, request: HttpRequest, obj=None):
        # Add your permission logic here
        return request.user.is_superuser
