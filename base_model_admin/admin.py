import json
import logging
from asyncio.log import logger

from django_json_widget.widgets import JSONEditorWidget

from action_runs.models import ActionRun
from django.contrib import admin
from django.contrib.admin.views.main import ChangeList
from django.core.serializers.json import DjangoJSONEncoder
from django.db import models
from django.db.models import JSONField
from django.forms import model_to_dict
from django.forms.models import modelformset_factory
from django.http import HttpResponseRedirect
from flows.models import Action, Model
from workspaces.models import Workspace

RECORDING_ID = 1


class CustomChangeList(ChangeList):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.formset = None


logger = logging.getLogger(__name__)


class InWorkspace(admin.ModelAdmin):
    change_form_template = "admin/change_form.html"

    formfield_overrides = {
        JSONField: {"widget": JSONEditorWidget},
    }

    actions = ["custom_action"]

    def change_view(self, request, object_id, form_url="", extra_context=None):
        extra_context = extra_context or {}
        obj = self.get_object(request, object_id)
        if obj:
            # Assuming 'general_info' is the field you want to edit as JSON
            extra_context["initial_json"] = json.dumps(obj.general_info)
        else:
            # Provide default JSON for new objects
            extra_context["initial_json"] = json.dumps(
                {"key": "value", "array": [1, 2, 3], "nested": {"a": 1, "b": 2}}
            )
        return super().change_view(
            request, object_id, form_url, extra_context=extra_context
        )

    def save_model(self, request, obj, form, change):
        json_data = request.POST.get("json_data")
        if json_data:
            # Assuming 'general_info' is the field you want to populate with JSON
            obj.general_info = json.loads(json_data)

        # Capture the input data
        input_data = {}
        for field_name, field_value in form.cleaned_data.items():
            if isinstance(field_value, models.Model):
                input_data[field_name] = field_value.pk
            elif isinstance(field_value, (str, int, float, bool, type(None))):
                input_data[field_name] = field_value
            else:
                input_data[field_name] = str(field_value)

        # Determine if this is a create or update action
        action = "update" if change else "create"

        # Call the original save_model method
        super().save_model(request, obj, form, change)

        # Capture the output data
        output_data = {}
        for field in obj._meta.fields:
            value = getattr(obj, field.name)
            if isinstance(value, models.Model):
                output_data[field.name] = value.pk
            elif isinstance(value, (str, int, float, bool, type(None))):
                output_data[field.name] = value
            else:
                output_data[field.name] = str(value)

        # Combine input and output data
        event_data = {"input": input_data, "output": output_data}

        # Record the event (assuming AdminEvent is imported and RECORDING_ID is defined)
        ActionRun.objects.create(
            user=request.user,
            action=action,
            model_name=obj._meta.model_name,
            object_id=obj.id,
            data=event_data,
            workspace_id=obj.workspace_id,
            recording_id=RECORDING_ID,
        )

    def custom_action(self, request, queryset):
        # Your custom action logic here
        self.message_user(request, "Custom action performed")

    custom_action.short_description = "Perform custom action"

    def response_change(self, request, obj):
        if "_custom_action" in request.POST:
            # Your custom action logic for a single object
            self.message_user(request, "Custom action performed for this object")
            return HttpResponseRedirect(".")
        return super().response_change(request, obj)

    def response_add(self, request, obj, post_url_continue=None):
        if "_custom_action" in request.POST:
            # Your custom action logic for a newly added object
            self.message_user(request, "Custom action performed for new object")
            return HttpResponseRedirect(".")
        return super().response_add(request, obj, post_url_continue)

    def save_model(self, request, obj, form, change):
        # Capture the input data
        input_data = {}
        for field_name, field_value in form.cleaned_data.items():
            if isinstance(field_value, models.Model):
                input_data[field_name] = field_value.pk
            elif isinstance(field_value, (str, int, float, bool, type(None))):
                input_data[field_name] = field_value
            else:
                input_data[field_name] = str(field_value)

        # Determine if this is a create or update action
        action_type = Action.ActionType.UPDATE if change else Action.ActionType.CREATE

        # Get or create the Model instance for this model
        model_instance, _ = Model.objects.get_or_create(
            name=obj._meta.model_name, app_label=obj._meta.app_label
        )

        # Get or create the Action instance
        action_instance, _ = Action.objects.get_or_create(
            action_type=action_type, model=model_instance, workspace_id=obj.workspace_id
        )

        # Call the original save_model method
        super().save_model(request, obj, form, change)

        # Capture the output data
        output_data = {}
        for field in obj._meta.fields:
            value = getattr(obj, field.name)
            if isinstance(value, models.Model):
                output_data[field.name] = value.pk
            elif isinstance(value, (str, int, float, bool, type(None))):
                output_data[field.name] = value
            else:
                output_data[field.name] = str(value)

        # Combine input and output data
        event_data = {"input": input_data, "output": output_data}

        # Record the event
        ActionRun.objects.create(
            user=request.user,
            action=action_instance,  # Use the Action instance here
            model_name=obj._meta.model_name,
            object_id=obj.id,
            data=event_data,
            workspace_id=obj.workspace_id,
            recording_id=RECORDING_ID,
        )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        workspace_id = request.environ.get("WORKSPACE_ID")
        logger.debug(f"get_queryset: workspace_id = {workspace_id}")
        if self.model == Workspace:
            return qs.filter(id=workspace_id)
        return qs.filter(workspace_id=workspace_id).select_related("workspace")

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        workspace_id = request.environ.get("WORKSPACE_ID")
        logger.debug(f"formfield_for_foreignkey: workspace_id = {workspace_id}")

        if db_field.name == "workspace":
            logger.debug("Handling workspace field")
            try:
                workspace = Workspace.objects.get(id=workspace_id)
                logger.debug(f"Found workspace: {workspace}")
                kwargs["queryset"] = Workspace.objects.filter(id=workspace_id)
                kwargs["initial"] = workspace
            except Workspace.DoesNotExist:
                logger.error(f"No workspace found with id: {workspace_id}")
            except Exception as e:
                logger.exception(f"Error setting workspace: {str(e)}")
        elif hasattr(db_field.related_model, "workspace"):
            logger.debug(f"Handling related field: {db_field.name}")
            kwargs["queryset"] = db_field.related_model.objects.filter(
                workspace_id=workspace_id
            )

        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def _log_admin_action(self, request, action, queryset, action_name):
        workspace_id = request.environ.get("WORKSPACE_ID")
        model_name = queryset.model._meta.model_name

        for obj in queryset:
            input_data = model_to_dict(obj)

            # Convert non-serializable objects in input_data
            for key, value in input_data.items():
                if not isinstance(value, (str, int, float, bool, type(None))):
                    input_data[key] = str(value)

            event_data = {"input": input_data}

            # Record the event
            ActionRun.objects.create(
                user=request.user,
                action=action_name,
                model_name=model_name,
                object_id=obj.id,
                data=event_data,
                workspace_id=workspace_id,
                recording_id=RECORDING_ID,  # Always use Recording with ID 1
            )

    def get_actions(self, request):
        actions = super().get_actions(request)

        # Wrap each action with our logging function
        for name, (func, description, short_description) in actions.items():
            actions[name] = (
                self._wrap_action(func, name),
                description,
                short_description,
            )

        return actions

    def _wrap_action(self, action, action_name):
        def wrapped_action(self, request, queryset):
            # Log the action before executing it
            self._log_admin_action(request, action, queryset, action_name)

            # Execute the original action
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

    def changelist_view(self, request, extra_context=None):
        # Log the GET request
        self._log_get_request(request)

        # Get the queryset
        qs = self.get_queryset(request)

        # Get or create the Action instance for LIST_VIEW
        list_view_action, _ = Action.objects.get_or_create(
            action_type=Action.ActionType.LIST_VIEW,
            model=Model.objects.get(name=self.model._meta.model_name),
            workspace_id=request.environ.get("WORKSPACE_ID"),
        )

        # Get the most recent AdminEvent for this list view
        admin_event = (
            ActionRun.objects.filter(
                model_name=self.model._meta.model_name,
                action=list_view_action,  # Use the Action instance here
                workspace_id=request.environ.get("WORKSPACE_ID"),
            )
            .order_by("-timestamp")
            .first()
        )

        if admin_event:
            # Use the output data from the admin event
            object_list = admin_event.data.get("output", [])
            # Convert the object_list back to a queryset
            try:
                id_list = [
                    obj.get("id") for obj in object_list if obj.get("id") is not None
                ]
                if id_list:
                    qs = self.model.objects.filter(id__in=id_list)
                else:
                    # If no valid IDs, return an empty queryset
                    qs = self.model.objects.none()
            except Exception as e:
                # Log the error and continue with the original queryset
                print(f"Error processing admin event data: {e}")

        # Create a ChangeList instance
        cl = self.get_changelist_instance(request)

        # Apply filters and search
        qs = cl.get_queryset(request)

        # Prepare the context
        context = {
            "cl": cl,
            "title": cl.title,
            "is_popup": cl.is_popup,
            "to_field": cl.to_field,
            "opts": cl.model._meta,
            "app_label": cl.model._meta.app_label,
            "actions_on_top": self.actions_on_top,
            "actions_on_bottom": self.actions_on_bottom,
            "actions_selection_counter": self.actions_selection_counter,
            "preserved_filters": self.get_preserved_filters(request),
        }

        context.update(extra_context or {})

        # Override the template
        self.change_list_template = "admin/change_list.html"

        return super().changelist_view(request, context)

    def _log_get_request(self, request):
        workspace_id = request.environ.get("WORKSPACE_ID")
        model_name = self.model._meta.model_name

        # Capture GET parameters
        input_data = dict(request.GET.items())

        # Get the queryset
        queryset = self.get_queryset(request)

        # Capture the output data (list of objects)
        output_data = json.loads(
            json.dumps(list(queryset.values()), cls=DjangoJSONEncoder)
        )

        event_data = {"input": input_data, "output": output_data}

        # Get or create the Model instance for this model
        model_instance, _ = Model.objects.get_or_create(
            name=self.model._meta.model_name, app_label=self.model._meta.app_label
        )

        # Get or create the Action instance for LIST_VIEW
        list_view_action, _ = Action.objects.get_or_create(
            action_type=Action.ActionType.LIST_VIEW,
            model=model_instance,
            workspace_id=workspace_id,
        )

        # Record the event
        ActionRun.objects.create(
            user=request.user,
            action=list_view_action,
            model_name=model_name,
            object_id=None,  # Use None instead of 0 for list views
            data=event_data,
            workspace_id=workspace_id,
            recording_id=RECORDING_ID,
        )
