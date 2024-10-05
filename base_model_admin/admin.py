import json

from django.contrib.admin.views.main import ChangeList
from django.http import HttpResponseRedirect
from django.shortcuts import redirect
from django.urls import reverse

from bluewind.context_variables import set_function, set_function_call
from function_calls.models import FunctionCall, get_function_call_whole_tree_v1
from functions.go_next.v1.functions import go_next_v1
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

    actions = ["custom_action"]

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
            function_call_id, redirect_link = go_next_v1()
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
            function_call_id, redirect_link = go_next_v1()
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
