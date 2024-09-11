import json
import logging
from asyncio.log import logger

from django_json_widget.widgets import JSONEditorWidget

from bluewind.utils import get_queryset
from django.contrib import admin
from django.contrib.admin.views.main import ChangeList
from django.contrib.contenttypes.models import ContentType
from django.core.serializers.json import DjangoJSONEncoder
from django.db import models
from django.db.models import JSONField
from django.forms import model_to_dict
from django.forms.models import modelformset_factory
from django.http import HttpResponseRedirect
from flows.models import Action, ActionRun, Recording
from workspaces.models import Workspace

logger = logging.getLogger(__name__)


def get_latest_recording(workspace_id):
    return (
        Recording.objects.filter(workspace_id=workspace_id)
        .order_by("-start_time")
        .first()
    )


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

    def save_model(self, request, obj, form, change):
        input_data = {}
        for field_name, field_value in form.cleaned_data.items():
            if isinstance(field_value, models.Model):
                input_data[field_name] = field_value.pk
            elif isinstance(field_value, (str, int, float, bool, type(None))):
                input_data[field_name] = field_value
            else:
                input_data[field_name] = str(field_value)

        action_type = Action.ActionType.SAVE if change else Action.ActionType.CREATE

        content_type = ContentType.objects.get_for_model(obj)

        action_instance, _ = Action.objects.get_or_create(
            action_type=action_type,
            content_type=content_type,
            workspace_id=obj.workspace_id,
            defaults={"action_type": action_type, "content_type": content_type},
        )

        logger.debug(
            f"Saving {obj._meta.model_name} with workspace_id: {obj.workspace_id}"
        )
        super().save_model(request, obj, form, change)

        output_data = {}
        for field in obj._meta.fields:
            value = getattr(obj, field.name)
            if isinstance(value, models.Model):
                output_data[field.name] = value.pk
            elif isinstance(value, (str, int, float, bool, type(None))):
                output_data[field.name] = value
            else:
                output_data[field.name] = str(value)

        latest_recording = get_latest_recording(obj.workspace_id)

        action_run = ActionRun(
            user=request.user,
            action=action_instance,
            model_name=obj._meta.model_name,
            # object_id=obj.id,
            action_input=input_data,
            results=output_data,
            workspace_id=obj.workspace_id,
            recording=latest_recording,
        )
        try:
            action_run.save()
            logger.debug(f"ActionRun saved successfully: {action_run.id}")
        except Exception as e:
            logger.error(f"Error saving ActionRun: {str(e)}")
            # Optionally, you might want to raise the exception or handle it differently
            raise

    def custom_action(self, request, queryset):
        self.message_user(request, "Custom action performed")

    custom_action.short_description = "Perform custom action"

    def response_change(self, request, obj):
        if "_custom_action" in request.POST:
            self.message_user(request, "Custom action performed for this object")
            return HttpResponseRedirect(".")
        return super().response_change(request, obj)

    def response_add(self, request, obj, post_url_continue=None):
        if "_custom_action" in request.POST:
            self.message_user(request, "Custom action performed for new object")
            return HttpResponseRedirect(".")
        return super().response_add(request, obj, post_url_continue)

    def get_queryset(self, request):
        return get_queryset(self, request)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        workspace_id = request.environ.get("WORKSPACE_ID")
        logger.debug(f"formfield_for_foreignkey: workspace_id = {workspace_id}")

        if db_field.name == "workspace":
            logger.debug("Handling workspace field")
            workspace = Workspace.objects.get(id=workspace_id)
            logger.debug(f"Found workspace: {workspace}")
            kwargs["queryset"] = Workspace.objects.filter(id=workspace_id)
            kwargs["initial"] = workspace
        elif hasattr(db_field.related_model, "workspace"):
            logger.debug(f"Handling related field: {db_field.name}")
            kwargs["queryset"] = db_field.related_model.objects.filter(
                workspace_id=workspace_id
            )

        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def _log_admin_action(self, request, action, queryset, action_name):
        workspace_id = request.environ.get("WORKSPACE_ID")
        content_type = ContentType.objects.get_for_model(queryset.model)

        action_instance = Action.objects.get(
            action_type=Action.ActionType.CUSTOM,
            content_type=content_type,
            workspace_id=workspace_id,
        )

        latest_recording = get_latest_recording(workspace_id)

        for obj in queryset:
            input_data = model_to_dict(obj)

            for key, value in input_data.items():
                if not isinstance(value, (str, int, float, bool, type(None))):
                    input_data[key] = str(value)

            ActionRun.objects.create(
                user=request.user,
                action=action_instance,
                model_name=content_type.model,
                # object_id=obj.id,
                action_input=input_data,
                results={},
                workspace_id=workspace_id,
                recording=latest_recording,
            )

    def get_actions(self, request):
        actions = super().get_actions(request)

        for name, (func, description, short_description) in actions.items():
            actions[name] = (
                self._wrap_action(func, name),
                description,
                short_description,
            )

        return actions

    def _wrap_action(self, action, action_name):
        def wrapped_action(self, request, queryset):
            self._log_admin_action(request, action, queryset, action_name)
            return action(self, request, queryset)

        return wrapped_action

    def get_changelist_class(self, request):
        return CustomChangeList

    def get_changelist_instance(self, request):
        cl = super().get_changelist_instance(request)
        if self.list_editable:
            FormSet = modelformset_factory(
                self.model, fields=self.list_editable, extra=0
            )
            cl.formset = FormSet(queryset=cl.result_list)
        else:
            cl.formset = None
        return cl

    def _log_get_request(self, request):
        workspace_id = request.environ.get("WORKSPACE_ID")
        content_type = ContentType.objects.get_for_model(self.model)

        # Check if this list action should be recorded
        try:
            action = Action.objects.get(
                content_type=content_type,
                action_type=Action.ActionType.LIST,
                workspace_id=workspace_id,
            )
            if not action.is_recorded:
                return  # Exit the method early without logging
        except Action.DoesNotExist:
            pass  # If the action doesn't exist, we'll proceed with logging

        input_data = dict(request.GET.items())

        queryset = self.get_queryset(request)

        output_data = json.loads(
            json.dumps(list(queryset.values()), cls=DjangoJSONEncoder)
        )

        list_view_action = Action.objects.get(
            action_type=Action.ActionType.LIST,
            content_type=content_type,
            workspace_id=workspace_id,
        )

        latest_recording = (
            Recording.objects.filter(workspace_id=workspace_id)
            .order_by("-start_time")
            .first()
        )

        ActionRun.objects.create(
            user=request.user,
            action=list_view_action,
            model_name=content_type.model,
            # object_id=None,
            action_input=input_data,
            results=output_data,
            workspace_id=workspace_id,
            recording=latest_recording,
        )
