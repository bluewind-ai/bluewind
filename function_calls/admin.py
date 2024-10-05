import json

from django.http import HttpRequest
from django.shortcuts import redirect, render
from django.utils.translation import gettext_lazy as _

from base_admin.admin import InWorkspace
from function_calls.models import (
    FunctionCall,
    get_function_call_whole_tree_v1,
    get_whole_tree,
)
from functions.go_next.v1.functions import go_next_v1
from functions.replay_until_here.v1.functions import replay_until_here_v1
from functions.restart.v1.functions import restart_v1
from functions.restart.v3.functions import restart_v3
from functions.restart.v4.functions import restart_v4
from treenode.admin import TreeNodeModelAdmin
from unfold.decorators import action


class FunctionCallAdmin(InWorkspace, TreeNodeModelAdmin):
    # actions_detail = [
    #     "restart",
    #     "replay_everything",
    #     "replay_everything_until_here",
    #     "replay_until_here",
    # ]
    # actions_submit_line = ["approve_function_call"]

    list_display = ("status", "executed_at", "id")
    list_display_links = ("indented_title",)

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
    #     # raise_debug(obj.created_at)
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

    @action(
        description=_("Restart"),
        url_path="restart",
    )
    def restart(self, request: HttpRequest, object_id: int):
        context = self.admin_site.each_context(request)

        return new_method(request, context)

    @action(
        description=_("Replay Everything"),
        url_path="replay_everything",
    )
    def replay_everything(self, request: HttpRequest, object_id: int):
        restart_v3(None)

        context = self.admin_site.each_context(request)

        context.update(
            {
                "title": "Redirecting...",
                "redirect_url": "/",
                "countdown_seconds": 0,
                "message": "Replaying everything...",
            }
        )

        return render(request, "admin/function_calls/delayed_redirect.html", context)

    @action(
        description=_("Replay Until here"),
        url_path="replay_until_here",
    )
    def replay_until_here(self, request: HttpRequest, object_id: int):
        if not object_id:
            function_name_to_reach = "unreachable_function"
        else:
            function_name_to_reach = FunctionCall.objects.get(
                pk=object_id
            ).function.name
        function_call_id = replay_until_here_v1(function_name_to_reach)
        # raise_debug(
        #     FunctionCall.objects.get(pk=function_call_id).id,
        #     FunctionCall.objects.get(pk=function_call_id).get_root(cache=False).id,
        # )
        function_call_id, redirect_link, object = go_next_v1()
        return redirect(redirect_link)

    @action(
        description=_("Replay Everything Until Here"),
        url_path="replay_everything_until_here",
    )
    def replay_everything_until_here(self, request: HttpRequest, object_id: int):
        restart_v4(object_id)

        function_call_id, redirect_link, object = go_next_v1()
        return redirect(redirect_link)

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

    def high_res_created_at(self, obj):
        if obj.created_at:
            # Format with microseconds, without timezone
            return obj.created_at.strftime("%Y-%m-%d %H:%M:%S.%f")
        return "-"


def new_method(request, context):
    restart_v1()
    context.update(
        {
            "title": "Redirecting...",
            "redirect_url": "/",
            "countdown_seconds": 5,
            "message": "Replaying everything...",
        }
    )

    return render(request, "admin/function_calls/delayed_redirect.html", context)
