import json

from django.http import HttpRequest
from django.shortcuts import get_object_or_404, render
from django.urls import path, reverse
from django.utils.safestring import mark_safe
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
from functions.restart.v1.functions import restart_v1
from unfold.decorators import action
from unfold.widgets import UnfoldAdminTextareaWidget


class FunctionCallForm(TreeNodeForm):
    class Meta:
        model = FunctionCall
        fields = [
            "status",
            "function",
            "input_data",
            "output_data",
            "executed_at",
        ]


class FunctionCallAdmin(InWorkspace, TreeNodeModelAdmin):
    form = FunctionCallForm
    actions_detail = [
        "approve_function_call",
        "mark_function_call_as_successful",
        "restart",
    ]

    list_display = ("function", "status", "executed_at", "id")
    list_display_links = ("indented_title",)

    readonly_fields = ["whole_tree"]

    def whole_tree(self, obj):
        if obj:
            json_data = json.dumps(obj.get_tree_json(), indent=2)
            widget = UnfoldAdminTextareaWidget()
            return mark_safe(
                widget.render("whole_tree", json_data, attrs={"readonly": "readonly"})
            )
        return ""

    whole_tree.short_description = "Whole Tree"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False  # Allow viewing, but saving will be prevented

    def has_delete_permission(self, request, obj=None):
        return False

    # def get_form(self, request, obj=None, **kwargs):
    #     form = super().get_form(request, obj, **kwargs)
    #     if obj:
    #         form.base_fields["whole_tree"].initial = self.get_whole_tree(obj)
    #     return form

    def whole_tree(self, obj):
        # if obj:
        #     raise_debug(JSONField())
        #     return JSONField().prepare_value(obj.get_tree_json())
        return {"ok": "ok"}

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
    def approve_function_call(self, request: HttpRequest, object_id: int):
        approve_function_call_v1(function_call_id=object_id)
        return go_next_v1()

    @action(
        description=_("Mark function call as successful"),
        url_path="mark_function_call_as_successful",
    )
    def mark_function_call_as_successful(self, request: HttpRequest, object_id: int):
        return handle_mark_function_call_as_successful_v1(function_call_id=object_id)

    @action(
        description=_("Restart"),
        url_path="restart",
    )
    def restart(self, request: HttpRequest, object_id: int):
        return restart_v1()

    def get_actions_detail(self, request, obj=None):
        set_is_function_call_magic(False)
        function_call = FunctionCall.objects.get(pk=obj)
        actions = super().get_actions_detail(request, obj)
        allowed_actions = get_allowed_actions_on_function_call_v1(function_call)
        actions = [action for action in actions if action.path in allowed_actions]
        return actions

    def has_retry_function_call_permission(self, request: HttpRequest, obj=None):
        return request.user.is_superuser

    import json

    from django.urls import reverse

    def get_tree(self, object_id):
        function_call = get_object_or_404(FunctionCall, id=object_id)

        def format_node(node):
            change_url = reverse(
                "admin:function_calls_functioncall_change", args=[node["id"]]
            )
            dummy_link = f"https://example.com/dummy/{node['id']}"
            return {
                "id": str(node["id"]),
                "text": f"{node['function_name']} ({node['status']})",
                "children": [format_node(child) for child in node["children"]],
                "data": {"change_url": change_url, "dummy_link": dummy_link},
            }

        tree_data = format_node(function_call.whole_tree)
        return function_call, [tree_data]

    def tree_view(self, request, object_id):
        function_call, tree_data = self.get_tree(object_id)
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
        ]
        return custom_urls + urls
