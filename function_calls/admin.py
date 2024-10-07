from django.http import HttpRequest
from django.shortcuts import redirect

from base_admin.admin import InWorkspace
from function_call_dependencies.models import FunctionCallDependency
from function_calls.models import (
    get_whole_tree,
)
from functions.reset.v1.functions import reset_v1
from unfold.admin import TabularInline


class FunctionCallDependentInline(TabularInline):
    model = FunctionCallDependency
    fk_name = "dependency"
    fields = ["dependency"]
    extra = 0
    verbose_name = "needs"
    verbose_name_plural = "needs"


class FunctionCallDependencyInline(TabularInline):
    model = FunctionCallDependency
    fk_name = "dependency"
    fields = ["dependent"]
    extra = 0
    verbose_name = "needed by"
    verbose_name_plural = "needed by"


class FunctionCallAdmin(InWorkspace):
    # actions_detail = [
    #     "restart",
    #     "replay_everything",
    #     "replay_everything_until_here",
    #     "replay_until_here",
    # ]
    # actions_submit_line = ["approve_function_call"]
    inlines = [FunctionCallDependencyInline, FunctionCallDependentInline]

    list_display = ("status", "executed_at", "id")

    readonly_fields = [
        "name",
        "whole_tree",
        "high_res_created_at",
        "status",
        "input_data",
        "output_data",
        "executed_at",
        "output_type",
    ]

    fields = [
        "name",
        "status",
        "input_data",
        "output_data",
        "high_res_created_at",
        "executed_at",
        "whole_tree",
        "output_type",
    ]

    def name(self, obj):
        return str(obj)

    name.short_description = "Name"

    def whole_tree(self, obj):
        return get_whole_tree(obj)

    whole_tree.short_description = "Whole Tree"

    def has_add_permission(self, request):
        return True

    def has_change_permission(self, request, obj=None):
        return True  # Allow viewing

    def has_delete_permission(self, request, obj=None):
        return True

    # @action(
    #     description=_("Approve"),
    #     url_path="approve_function_call",
    #     permissions=["approve_function_call"],
    # )
    # def approve_function_call(self, request: HttpRequest, obj):
    #     approve_function_call_v2(function_call=obj)

    # def has_approve_function_call_permission(
    #     self, request: HttpRequest, object_id: Union[str, int]
    # ):
    #     if not object_id:
    #         return True
    #     function_call = FunctionCall.objects.get(pk=object_id)

    #     if function_call.status in FunctionCall.successful_terminal_stages():
    #         return False
    #     return True

    def has_retry_function_call_permission(self, request: HttpRequest, obj=None):
        return request.user.is_superuser

    def high_res_created_at(self, obj):
        if obj.created_at:
            # Format with microseconds, without timezone
            return obj.created_at.strftime("%Y-%m-%d %H:%M:%S.%f")
        return "-"


def new_method(function_call, user):
    reset_v1(user)
    return redirect("/")
