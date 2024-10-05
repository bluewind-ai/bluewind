import json
from typing import Union

from django.http import HttpRequest
from django.shortcuts import render
from django.utils.translation import gettext_lazy as _

from base_model_admin.admin import InWorkspace
from function_calls.models import (
    FunctionCall,
    get_function_call_whole_tree_v1,
    get_whole_tree,
)
from functions.approve_function_call.v1.functions import approve_function_call_v1
from functions.get_allowed_actions_on_function_call.v1.functions import (
    get_allowed_actions_on_function_call_v1,
)
from functions.handle_mark_function_call_as_successful.v1.functions import (
    handle_mark_function_call_as_successful_v1,
)
from functions.restart.v1.functions import restart_v1
from treenode.admin import TreeNodeModelAdmin
from unfold.decorators import action


class FunctionCallAdmin(InWorkspace, TreeNodeModelAdmin):
    actions_detail = ["restart"]
    actions_submit_line = ["approve_function_call"]

    list_display = ("status", "executed_at", "id")
    list_display_links = ("indented_title",)

    readonly_fields = [
        "name",
        "whole_tree",
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

    @action(
        description=_("Approve"),
        url_path="approve_function_call",
        permissions=["approve_function_call"],
    )
    def approve_function_call(self, request: HttpRequest, obj):
        if obj.status == FunctionCall.Status.READY_FOR_APPROVAL:
            approve_function_call_v1(function_call_id=obj.id)
        else:
            handle_mark_function_call_as_successful_v1(function_call_id=obj.id)

    def has_approve_function_call_permission(
        self, request: HttpRequest, object_id: Union[str, int]
    ):
        if not object_id:
            return True
        function_call = FunctionCall.objects.get(pk=object_id)

        if function_call.status in FunctionCall.successful_terminal_stages():
            return False
        return True

    @action(
        description=_("Restart"),
        url_path="restart",
    )
    def restart(self, request: HttpRequest, object_id: int):
        context = self.admin_site.each_context(request)

        return new_method(request, context)

    def get_actions_detail(self, request, obj=None):
        function_call = FunctionCall.objects.get(pk=obj)
        actions = super().get_actions_detail(request, obj)
        allowed_actions = get_allowed_actions_on_function_call_v1(function_call)
        actions = [action for action in actions if action.path in allowed_actions]
        return actions

    def has_retry_function_call_permission(self, request: HttpRequest, obj=None):
        return request.user.is_superuser

    def change_view(self, request, object_id, form_url="", extra_context=None):
        extra_context = extra_context or {}
        tree_data = get_function_call_whole_tree_v1(object_id)
        extra_context["tree_json"] = json.dumps(tree_data)

        return super().change_view(
            request,
            object_id,
            form_url,
            extra_context=extra_context,
        )


def new_method(request, context):
    restart_v1()
    context.update(
        {
            "title": "Redirecting...",
            "redirect_url": "/",
        }
    )

    return render(request, "admin/function_calls/delayed_redirect.html", context)
