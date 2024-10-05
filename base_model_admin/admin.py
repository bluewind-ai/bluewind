import json

from django.contrib.admin.views.main import ChangeList
from django.http import HttpRequest, HttpResponseRedirect
from django.shortcuts import redirect, render
from django.urls import reverse
from django.utils.translation import gettext_lazy as _

from bluewind.context_variables import set_function, set_function_call
from function_calls.models import (
    FunctionCall,
    get_function_call_whole_tree_v1,
)
from functions.approve_function_call.v2.functions import approve_function_call_v2
from functions.get_allowed_actions_on_function_call.v1.functions import (
    get_allowed_actions_on_function_call_v1,
)
from functions.go_next.v1.functions import go_next_v1
from functions.handle_function_call_after_save.v1.functions import (
    handle_function_call_after_save_v1,
)
from functions.replay_until_here.v1.functions import replay_until_here_v1
from functions.restart.v3.functions import restart_v3
from functions.restart.v4.functions import restart_v4
from unfold.decorators import action
from users.models import User

# from recordings.models import Recording

# def get_latest_recording(workspace_id):
#     return (
#         Recording.objects.filter(workspace=get_workspace())
#         .order_by("-start_time")
#         .first()
#     )


class CustomChangeList(ChangeList):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.formset = None


from unfold.admin import ModelAdmin


class InWorkspace(ModelAdmin):
    change_form_template = "admin/change_form.html"
    actions_submit_line = ["approve_function_call"]

    actions_detail = [
        "restart",
        "replay_everything",
        "replay_everything_until_here",
        "replay_until_here",
    ]

    def custom_action(self, request, queryset):
        self.message_user(request, "Custom action performed")

    custom_action.short_description = "Perform custom action"

    def response_add(self, request, obj, post_url_continue=None):
        return self.response_post_save_change(request, obj)

    def response_change(self, request, obj):
        return self.response_post_save_change(request, obj)

    def response_post_save_change(self, request, obj):
        opts = self.model._meta
        if "_addanother" in request.POST:
            url = reverse(f"admin:{opts.app_label}_{opts.model_name}_add")
        else:
            url = reverse(
                f"admin:{opts.app_label}_{opts.model_name}_change", args=[obj.pk]
            )
        return HttpResponseRedirect(url)

        # def get_queryset(self, request):
        #     return get_queryset(self, request)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "user":  # Add this condition
            kwargs["initial"] = request.user
            kwargs["queryset"] = User.objects.filter(id=request.user.id)

        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def change_view(self, request, object_id, form_url="", extra_context=None):
        if object_id:
            tree_data = get_function_call_whole_tree_v1(object_id)
            extra_context["tree_json"] = json.dumps(tree_data)
        response = super().change_view(request, object_id, form_url, extra_context)

        if request.POST:
            function_call_id, redirect_link, object = go_next_v1()
            return redirect(redirect_link)
        return response

    def add_view(self, request, form_url="", extra_context=None):
        function_call_id = None
        function_call_to_approve = None
        request_post = request.POST
        extra_context = extra_context or {}
        if request_post:
            function_call_id = request_post.get("function_call")
            tree_data = get_function_call_whole_tree_v1(function_call_id)
            extra_context["tree_json"] = json.dumps(tree_data)

            if function_call_id:
                function_call_to_approve = FunctionCall.objects.filter(
                    status=FunctionCall.Status.READY_FOR_APPROVAL
                ).first()

                set_function(function_call_to_approve.function)
                set_function_call(function_call_to_approve)
        else:
            extra_context = self.get_add_view(request, extra_context)

        response = super().add_view(request, form_url, extra_context)

        if not response.status_code == 302:
            return response
        if function_call_to_approve:
            function_call_id, redirect_link, _ = go_next_v1()
            return redirect(redirect_link)
        return response

    def get_add_view(self, request, extra_context=None):
        request_get = request.GET
        if request_get:
            function_call_id = request_get.get("function_call")
            if not function_call_id:
                return extra_context

            extra_context = extra_context or {}
            tree_data = get_function_call_whole_tree_v1(function_call_id)
            extra_context["tree_json"] = json.dumps(tree_data)
            return extra_context
        return extra_context

    @action(
        description=_("Approve"),
        url_path="approve_function_call",
    )
    def approve_function_call(self, request: HttpRequest, obj):
        # raise_debug(obj.created_at)
        # raise_debug(obj.__class__.__name__ == "FunctionCall")
        if obj.__class__.__name__ == "FunctionCall":
            approve_function_call_v2(function_call=obj)
        else:
            handle_function_call_after_save_v1(obj)

    # def has_approve_function_call_permission(
    #     self, request: HttpRequest, object_id: Union[str, int]
    # ):
    #     if not object_id:
    #         return True
    #     function_call = FunctionCall.objects.get(pk=object_id)

    #     if function_call.status in FunctionCall.successful_terminal_stages():
    #         return False
    #     return True

    def get_actions_detail(self, request, obj=None):
        if obj.__class__.__name__ != "FunctionCall":
            return super().get_actions_detail(request, obj)
        function_call = FunctionCall.objects.get(pk=obj)
        actions = super().get_actions_detail(request, obj)
        allowed_actions = get_allowed_actions_on_function_call_v1(function_call)
        actions = [action for action in actions if action.path in allowed_actions]
        return actions

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
