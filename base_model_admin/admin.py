import json
from asyncio.log import logger

from django_json_widget.widgets import JSONEditorWidget

from admin_events.models import AdminEvent
from django.contrib import admin
from django.contrib.admin.views.main import ChangeList
from django.core import serializers
from django.core.serializers.json import DjangoJSONEncoder
from django.db import models
from django.db.models import JSONField
from django.forms import model_to_dict
from django.forms.models import modelformset_factory
from workspaces.models import Workspace

RECORDING_ID = 3


class CustomChangeList(ChangeList):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.formset = None


class InWorkspace(admin.ModelAdmin):
    formfield_overrides = {
        JSONField: {"widget": JSONEditorWidget},
    }

    def save_model(self, request, obj, form, change):
        # Capture the input data
        input_data = form.cleaned_data.copy()

        # Convert non-serializable objects in input_data
        for key, value in input_data.items():
            if isinstance(value, models.Model):
                # For foreign key relationships, store the primary key
                input_data[key] = value.pk
            elif not isinstance(value, (str, int, float, bool, type(None))):
                # For other complex types, use JSON serialization
                input_data[key] = serializers.serialize("json", [value])

        # Determine if this is a create or update action
        action = "update" if change else "create"

        # Call the original save_model method
        super().save_model(request, obj, form, change)

        # Capture the output data
        output_data = model_to_dict(obj)

        # Convert non-serializable objects in output_data
        for key, value in output_data.items():
            if not isinstance(value, (str, int, float, bool, type(None))):
                output_data[key] = str(value)

        # Combine input and output data
        event_data = {"input": input_data, "output": output_data}

        # Get the actual model name
        model_name = obj._meta.model_name

        # Record the event
        AdminEvent.objects.create(
            user=request.user,
            action=action,
            model_name=model_name,
            object_id=obj.id,
            data=event_data,
            workspace_id=obj.workspace_id,
            recording_id=RECORDING_ID,  # Always use Recording with ID 1
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
            AdminEvent.objects.create(
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

        # Get the most recent AdminEvent for this list view
        admin_event = (
            AdminEvent.objects.filter(
                model_name=self.model._meta.model_name,
                action="list_view",
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

        # Record the event
        AdminEvent.objects.create(
            user=request.user,
            action="list_view",
            model_name=model_name,
            object_id=0,  # Use a placeholder value instead of None
            data=event_data,
            workspace_id=workspace_id,
            recording_id=RECORDING_ID,  # Always use Recording with ID 1
        )
