from django import forms
from django.contrib import admin
from django.http import HttpRequest
from django.shortcuts import redirect
from django.utils.translation import gettext_lazy as _

from base_model_admin.admin import InWorkspace
from function_calls.models import FunctionCall
from functions.approve_function_call.v1.functions import approve_function_call_v1
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
            "executed_at",
            "parent",
        ]


@admin.register(FunctionCall)
class FunctionCallAdmin(InWorkspace, admin.ModelAdmin):
    form = FunctionCallForm
    actions_detail = ["approve_function_call"]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False  # Allow viewing, but saving will be prevented

    def has_delete_permission(self, request, obj=None):
        return False

    @action(
        description=_("Approve"),
        url_path="approve_function_call",
    )
    def approve_function_call(self, request: HttpRequest, object_id: int):
        approve_function_call_v1(function_call_id=object_id)
        function_call = FunctionCall.objects.filter(
            status=FunctionCall.Status.READY_FOR_APPROVAL
        ).first()
        if function_call.function.name == "create_domain_name_v1":
            return redirect(
                f"/workspaces/2/admin/domain_names/domainname/add/?function_call={function_call.id}"
            )
            raise Exception("Function call not approved")
        return redirect(
            f"/workspaces/2/admin/function_calls/functioncall/{function_call.id}/change"
        )

    def has_retry_function_call_permission(self, request: HttpRequest, obj=None):
        # Add your permission logic here
        return request.user.is_superuser
