from django import forms
from django.http import HttpRequest
from django.utils.translation import gettext_lazy as _

from base_model_admin.admin import InWorkspace
from function_calls.models import FunctionCall
from functions.approve_function_call.v1.functions import approve_function_call_v1
from functions.get_allowed_actions_on_function_call.v1.functions import (
    get_allowed_actions_on_function_call_v1,
)
from functions.go_next.v1.functions import go_next_v1
from functions.handle_mark_function_call_as_successful.v1.functions import (
    handle_mark_function_call_as_successful_v1,
)
from unfold import admin
from unfold.decorators import action


class ChildFunctionCallInline(admin.TabularInline):
    model = FunctionCall
    extra = 0
    fields = ("function",)
    readonly_fields = ("function",)

    def has_add_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class FunctionCallForm(forms.ModelForm):
    class Meta:
        model = FunctionCall
        fields = [
            "status",
            "function",
            "state",
            "output_data",
            "user",
            "thoughts",
            "workspace",
            "executed_at",
            "parent",
        ]


class FunctionCallAdmin(InWorkspace):
    form = FunctionCallForm
    actions_detail = ["approve_function_call", "mark_function_call_as_successful"]
    inlines = [ChildFunctionCallInline]

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
        return go_next_v1()

    @action(
        description=_("Mark function call as successful"),
        url_path="mark_function_call_as_successful",
    )
    def mark_function_call_as_successful(self, request: HttpRequest, object_id: int):
        return handle_mark_function_call_as_successful_v1(function_call_id=object_id)

    def get_actions_detail(self, request, obj=None):
        function_call = FunctionCall.objects.get(pk=obj)
        actions = super().get_actions_detail(request, obj)
        allowed_actions = get_allowed_actions_on_function_call_v1(function_call)
        actions = [action for action in actions if action.path in allowed_actions]

        return actions

    # @action(
    #     description=_("Approve"),
    #     url_path="mark_function_call_as_failed",
    # )
    # def mark_function_call_as_failed(self, request: HttpRequest, object_id: int):
    #     mark_function_call_as_failed_v1(function_call_id=object_id)
    #     return redirect(
    #         f"/workspaces/2/admin/function_calls/functioncall/{function_call.id}/change"
    #     )

    def has_retry_function_call_permission(self, request: HttpRequest, obj=None):
        # Add your permission logic here
        return request.user.is_superuser
