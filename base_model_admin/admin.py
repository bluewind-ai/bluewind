from asyncio.log import logger

from django.contrib import admin
from django.contrib.admin.views.main import ChangeList
from django.db.models import JSONField
from django.http import HttpResponseRedirect
from django.urls import reverse
from django_json_widget.widgets import JSONEditorWidget

from bluewind.context_variables import get_workspace_id
from bluewind.utils import get_queryset

# from recordings.models import Recording
from users.models import User
from workspaces.models import Workspace

# def get_latest_recording(workspace_id):
#     return (
#         Recording.objects.filter(workspace_id=workspace_id)
#         .order_by("-start_time")
#         .first()
#     )


class CustomChangeList(ChangeList):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.formset = None


class InWorkspace(admin.ModelAdmin):
    change_form_template = "admin/change_form.html"

    formfield_overrides = {
        JSONField: {"widget": JSONEditorWidget},
    }

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

    def get_queryset(self, request):
        return get_queryset(self, request)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        workspace_id = get_workspace_id()
        logger.debug(f"formfield_for_foreignkey: workspace_id = {workspace_id}")

        if db_field.name == "workspace":
            logger.debug("Handling workspace field")
            workspace = Workspace.objects.get(id=workspace_id)
            logger.debug(f"Found workspace: {workspace}")
            kwargs["queryset"] = Workspace.objects.filter(id=workspace_id)
            kwargs["initial"] = workspace
        elif db_field.name == "user":  # Add this condition
            kwargs["initial"] = request.user
            kwargs["queryset"] = User.objects.filter(id=request.user.id)
        elif hasattr(db_field.related_model, "workspace"):
            logger.debug(f"Handling related field: {db_field.name}")
            kwargs["queryset"] = db_field.related_model.objects.filter(
                workspace_id=workspace_id
            )

        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    # def _log_admin_action(self, request, action, queryset, action_name):
    #     workspace_id = get_workspace_id()
    #     content_type = ContentType.objects.get_for_model(queryset.model)

    #     action_instance = Action.objects.get(
    #         action_type=Action.ActionType.CUSTOM,
    #         content_type=content_type,
    #         workspace_id=workspace_id,
    #     )

    #     latest_recording = get_latest_recording(workspace_id)

    #     for obj in queryset:
    #         input_data = model_to_dict(obj)

    #         for key, value in input_data.items():
    #             if not isinstance(value, (str, int, float, bool, type(None))):
    #                 input_data[key] = str(value)

    #         ActionRun.objects.create(
    #             user=request.user,
    #             action=action_instance,
    #             model_name=content_type.model,
    #             object_id=obj.id,
    #             action_input=input_data,
    #             results={},
    #             workspace_id=workspace_id,
    #             recording=latest_recording,
    #         )

    # def _wrap_action(self, action, action_name):
    #     def wrapped_action(self, request, queryset):
    #         self._log_admin_action(request, action, queryset, action_name)
    #         return action(self, request, queryset)

    #     return wrapped_action

    # def get_changelist_class(self, request):
    #     return CustomChangeList

    # def get_changelist_instance(self, request):
    #     cl = super().get_changelist_instance(request)
    #     if self.list_editable:
    #         FormSet = modelformset_factory(
    #             self.model, fields=self.list_editable, extra=0
    #         )
    #         cl.formset = FormSet(queryset=cl.result_list)
    #     else:
    #         cl.formset = None
    #     return cl

    # def _log_get_request(self, request):
    #     workspace_id = get_workspace_id()
    #     content_type = ContentType.objects.get_for_model(self.model)

    #     # Check if this list action should be recorded
    #     try:
    #         action = Action.objects.get(
    #             content_type=content_type,
    #             action_type=Action.ActionType.LIST,
    #             workspace_id=workspace_id,
    #         )
    #         if not action.is_recorded:
    #             return  # Exit the method early without logging
    #     except Action.DoesNotExist:
    #         pass  # If the action doesn't exist, we'll proceed with logging

    #     input_data = dict(request.GET.items())

    #     queryset = self.get_queryset(request)

    #     output_data = json.loads(
    #         json.dumps(list(queryset.values()), cls=DjangoJSONEncoder)
    #     )

    #     list_view_action = Action.objects.get(
    #         action_type=Action.ActionType.LIST,
    #         content_type=content_type,
    #         workspace_id=workspace_id,
    #     )

    #     latest_recording = (
    #         Recording.objects.filter(workspace_id=workspace_id)
    #         .order_by("-start_time")
    #         .first()
    #     )

    #     ActionRun.objects.create(
    #         user=request.user,
    #         action=list_view_action,
    #         model_name=content_type.model,
    #         object_id=None,
    #         action_input=input_data,
    #         results=output_data,
    #         workspace_id=workspace_id,
    #         recording=latest_recording,
    #     )


"cdscdsdss"
