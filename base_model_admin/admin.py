from asyncio.log import logger

from django_json_widget.widgets import JSONEditorWidget

from admin_events.models import AdminEvent
from django.contrib import admin
from django.core import serializers
from django.db import models
from django.db.models import JSONField
from django.forms import model_to_dict
from workspaces.models import Workspace


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

    def changelist_view(self, request, extra_context=None):
        # Log the GET request
        self._log_get_request(request)

        # Call the original changelist_view
        return super().changelist_view(request, extra_context)

    def _log_get_request(self, request):
        workspace_id = request.environ.get("WORKSPACE_ID")
        model_name = self.model._meta.model_name

        # Capture GET parameters
        input_data = dict(request.GET.items())

        event_data = {"input": input_data}

        # Record the event
        AdminEvent.objects.create(
            user=request.user,
            action="list_view",
            model_name=model_name,
            object_id=0,  # Use a placeholder value instead of None
            data=event_data,
            workspace_id=workspace_id,
        )
