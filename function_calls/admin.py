import json

from django.http import HttpRequest
from django.shortcuts import get_object_or_404, render
from django.urls import path, reverse
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
    ]

    fields = [
        "name",
        "status",
        "input_data",
        "output_data",
        "executed_at",
        "whole_tree",
    ]

    def name(self, obj):
        return str(obj)

    name.short_description = "Name"

    def whole_tree(self, obj):
        return obj.get_whole_tree()

    whole_tree.short_description = "Whole Tree"

    def has_add_permission(self, request):
        return True

    def has_change_permission(self, request, obj=None):
        return True  # Allow viewing

    def has_delete_permission(self, request, obj=None):
        return True

    def get_tree_json(self, node):
        return {
            "id": node.id,
            "function": node.function,
            "status": node.status,
            "children": [self.get_tree_json(child) for child in node.get_children()],
        }

    @action(
        description=_("Approve"),
        url_path="approve_function_call",
    )
    def approve_function_call(self, request: HttpRequest, obj):
        if obj.status == FunctionCall.Status.READY_FOR_APPROVAL:
            approve_function_call_v1(function_call_id=obj.id)
        else:
            handle_mark_function_call_as_successful_v1(function_call_id=obj.id)

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

    def tree_view(self, request, object_id):
        function_call, tree_data = get_function_call_whole_tree_v1(object_id)
        context = self.admin_site.each_context(request)
        context.update(
            {
                "title": f"Tree View for Function Call {object_id}",
                "function_call": function_call,
                "tree_json": json.dumps(tree_data),
            }
        )
        return render(request, "admin/function_calls/tree_view.html", context)

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "<path:object_id>/tree_view/",
                self.admin_site.admin_view(self.tree_view),
                name="function_call_tree_view",
            ),
            path(
                "go_next",
                self.admin_site.admin_view(self.go_next),
                name="go_next",
            ),
        ]
        return custom_urls + urls

    def change_view(self, request, object_id, form_url="", extra_context=None):
        extra_context = extra_context or {}
        function_call, tree_data = get_function_call_whole_tree_v1(object_id)
        extra_context["tree_json"] = json.dumps(tree_data)

        response = super().change_view(
            request,
            object_id,
            form_url,
            extra_context=extra_context,
        )
        if request.POST:
            return go_next_v1(request, extra_context)
        return response

    def go_next(self, request, object_id):
        return go_next_v1()


def get_function_call_whole_tree_v1(function_call_id):
    function_call = get_object_or_404(FunctionCall, id=function_call_id)

    def format_node(node):
        change_url = reverse(
            "admin:function_calls_functioncall_change", args=[node["id"]]
        )
        dummy_link = f"https://example.com/dummy/{node['id']}"

        # Get the FunctionCall object to access the get_status_emoji method
        node_obj = FunctionCall.objects.get(id=node["id"])
        emoji = node_obj.get_status_emoji()

        return {
            "id": str(node["id"]),
            "text": f"{node['function_name']} {emoji}",
            "children": [format_node(child) for child in node["children"]],
            "data": {"change_url": change_url, "dummy_link": dummy_link},
        }

    tree_data = format_node(function_call.get_whole_tree())
    return function_call, [tree_data]


def new_method(request, context):
    restart_v1()
    context.update(
        {
            "title": "Redirecting...",
            "redirect_url": "/",
        }
    )

    return render(request, "admin/function_calls/delayed_redirect.html", context)
