from django.http import HttpRequest
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from treenode.admin import TreeNodeModelAdmin
from treenode.forms import TreeNodeForm

from base_model_admin.admin import InWorkspace
from bluewind.context_variables import set_is_function_call_magic
from function_calls.models import FunctionCall
from functions.approve_function_call.v1.functions import approve_function_call_v1
from functions.get_allowed_actions_on_function_call.v1.functions import (
    get_allowed_actions_on_function_call_v1,
)
from functions.go_next.v1.functions import go_next_v1
from functions.handle_mark_function_call_as_successful.v1.functions import (
    handle_mark_function_call_as_successful_v1,
)
from unfold.decorators import action


class FunctionCallForm(TreeNodeForm):
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


class FunctionCallAdmin(InWorkspace, TreeNodeModelAdmin):
    form = FunctionCallForm
    actions_detail = ["approve_function_call", "mark_function_call_as_successful"]

    list_display = (
        "indented_title",
        "function",
        "status",
        "executed_at",
    )
    list_display_links = ("indented_title",)

    def indented_title(self, obj):
        print(f"Depth: {obj.depth}, Object: {obj}")  # Debug print
        return format_html(
            '<div style="text-indent:{}px">{} ({})</div>',
            obj.depth * 20,
            str(obj),
            obj.get_descendant_count(),
        )

    indented_title.short_description = "Function Call"

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.get_descendants(include_self=True)

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
        set_is_function_call_magic(False)
        function_call = FunctionCall.objects.get(pk=obj)
        actions = super().get_actions_detail(request, obj)
        allowed_actions = get_allowed_actions_on_function_call_v1(function_call)
        actions = [action for action in actions if action.path in allowed_actions]
        return actions

    def has_retry_function_call_permission(self, request: HttpRequest, obj=None):
        return request.user.is_superuser


# Don't forget to register your admin class
from django.contrib import admin

admin.site.register(FunctionCall, FunctionCallAdmin)
