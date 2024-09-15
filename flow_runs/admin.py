# flow_runs/admin.py
import importlib
import logging

from django.contrib import admin, messages
from django.contrib.contenttypes.models import ContentType
from django.shortcuts import redirect
from django.template.response import TemplateResponse
from django.urls import reverse
from django.utils import timezone
from django.utils.html import escape

from base_model_admin.admin import InWorkspace
from flows.models import Flow  # Adjust import based on your project structure
from workspaces.models import Workspace  # Adjust import based on your project structure

from .models import FlowRun

logger = logging.getLogger("django.temp")


@admin.register(FlowRun)
class FlowRunAdmin(InWorkspace):
    # Specify a custom template for the add form if needed
    add_form_template = "admin/flow_runs/flowrun/add_form.html"

    # Use the standard change_form template
    change_form_template = "admin/change_form.html"

    def has_change_permission(self, request, obj=None):
        """
        Allow access to the change form but prevent modifications by making fields read-only.
        """
        return True  # Allow access to the change form

    def get_readonly_fields(self, request, obj=None):
        """
        Make all fields read-only when viewing an existing FlowRun.
        """
        if obj:  # If editing an existing object
            return [field.name for field in self.model._meta.fields]
        return self.readonly_fields

    def get_actions(self, request):
        """
        Disable all bulk actions on the changelist.
        """
        return []

    def change_view(self, request, object_id, form_url="", extra_context=None):
        """
        Handle the change view to make it read-only and prevent saving changes.
        """
        if request.method == "POST":
            # Prevent any POST requests from modifying the object
            self.message_user(
                request,
                "Changes to FlowRun objects are not allowed.",
                level=messages.ERROR,
            )
            return redirect(
                reverse(
                    f"admin:{self.model._meta.app_label}_{self.model._meta.model_name}_changelist"
                )
            )

        return super().change_view(request, object_id, form_url, extra_context)

    def save_model(self, request, obj, form, change):
        """
        Override save_model to prevent saving changes.
        """
        if change:
            # Do not save changes to existing objects
            self.message_user(
                request,
                "Saving changes to FlowRun objects is not permitted.",
                level=messages.ERROR,
            )
            return
        super().save_model(request, obj, form, change)

    def add_view(self, request, form_url="", extra_context=None):
        logger.debug("Entered add_view")

        # Retrieve the 'flow' query parameter
        flow_id = request.GET.get("flow")
        if not flow_id:
            self.message_user(
                request, "Missing 'flow' query parameter.", level=messages.ERROR
            )
            return redirect(
                reverse(
                    f"admin:{self.model._meta.app_label}_{self.model._meta.model_name}_changelist"
                )
            )

        try:
            # Fetch the Flow instance based on flow_id
            flow = Flow.objects.get(pk=flow_id)
            logger.debug(f"Retrieved Flow: {flow}")
        except Flow.DoesNotExist:
            self.message_user(
                request, f"Flow with ID {flow_id} does not exist.", level=messages.ERROR
            )
            return redirect(
                reverse(
                    f"admin:{self.model._meta.app_label}_{self.model._meta.model_name}_changelist"
                )
            )

        # Dynamically import the flow definition module
        module_name = f"flows.flows.{flow.name}"
        logger.debug(f"Trying to import module: {module_name}")
        try:
            flow_module = importlib.import_module(module_name)
            logger.debug(f"Module {module_name} imported successfully")
        except ImportError:
            logger.error(f"Module {module_name} not found.")
            self.message_user(
                request, f"Module {escape(module_name)} not found.", level="error"
            )
            return redirect(
                reverse(
                    f"admin:{self.model._meta.app_label}_{self.model._meta.model_name}_changelist"
                )
            )

        # Convert snake_case to PascalCase for class names
        def snake_to_pascal(snake_str):
            return "".join(word.title() for word in snake_str.split("_"))

        function_name = flow.name
        form_class_name = f"{snake_to_pascal(function_name)}Form"
        logger.debug(
            f"Function name: {function_name}, Form class name: {form_class_name}"
        )

        # Retrieve the form class and the function to execute
        FormClass = getattr(flow_module, form_class_name, None)
        function_to_run = getattr(flow_module, function_name, None)

        if FormClass:
            logger.debug(f"Form class {FormClass} found")
        else:
            logger.error(
                f"Form class {form_class_name} not found in module {module_name}"
            )

        if function_to_run:
            logger.debug(f"Function {function_to_run} found")
        else:
            logger.error(f"Function {function_name} not found in module {module_name}")

        if not FormClass or not function_to_run:
            self.message_user(
                request,
                f"Function or Form not found for {escape(flow.name)}",
                level="error",
            )
            return redirect(
                reverse(
                    f"admin:{self.model._meta.app_label}_{self.model._meta.model_name}_changelist"
                )
            )

        if request.method == "POST":
            form = FormClass(request.POST)
            logger.debug(f"POST request with data: {request.POST}")
            if form.is_valid():
                logger.debug("Form is valid")
                # Log cleaned data with types
                for field, value in form.cleaned_data.items():
                    logger.debug(f"Form field '{field}': {value} (Type: {type(value)})")

                # Extract the ContentType instance
                content_type = form.cleaned_data.get("content_type")

                # Execute the function with form data
                try:
                    result = function_to_run(content_type=content_type)
                    logger.debug(f"Function executed, result: {result}")
                except Exception as e:
                    logger.error(f"Error in {function_name}: {e}")
                    result = f"Error: {str(e)}"

                # Prepare input_data with serializable data
                input_data = form.cleaned_data.copy()
                if isinstance(content_type, ContentType):
                    input_data["content_type"] = (
                        content_type.natural_key()
                    )  # Serialize to tuple
                    logger.debug(
                        f"Serialized 'content_type' to natural key: {content_type.natural_key()}"
                    )

                # Retrieve the workspace from the URL or request
                # Assuming your URL pattern includes 'workspaces/<workspace_id>/admin/...'
                # Extract 'workspace_id' from the URL
                workspace_id = self.get_workspace_id_from_request(request)
                if not workspace_id:
                    self.message_user(
                        request, "Workspace not found in the URL.", level=messages.ERROR
                    )
                    return redirect(
                        reverse(
                            f"admin:{self.model._meta.app_label}_{self.model._meta.model_name}_changelist"
                        )
                    )

                try:
                    workspace = Workspace.objects.get(pk=workspace_id)
                    logger.debug(f"Retrieved Workspace: {workspace}")
                except Workspace.DoesNotExist:
                    self.message_user(
                        request,
                        f"Workspace with ID {workspace_id} does not exist.",
                        level=messages.ERROR,
                    )
                    return redirect(
                        reverse(
                            f"admin:{self.model._meta.app_label}_{self.model._meta.model_name}_changelist"
                        )
                    )

                # Create and save the FlowRun instance with user and workspace
                flow_run = FlowRun(
                    user=request.user,  # Set the user to the current user
                    workspace=workspace,  # Set the workspace
                    input_data=input_data,
                    result=result,
                    executed_at=timezone.now(),
                    flow=flow,
                )
                flow_run.save()
                logger.debug(f"FlowRun saved with input_data: {flow_run.input_data}")

                # Display the result to the user
                messages.info(request, f"Flow Result:\n{escape(result)}")
                return redirect(
                    reverse(
                        f"admin:{self.model._meta.app_label}_{self.model._meta.model_name}_changelist"
                    )
                )
            else:
                logger.debug(f"Form is invalid: {form.errors}")
        else:
            form = FormClass()
            logger.debug("Created new form instance")

        # Prepare context for the add form template
        context = {
            **self.admin_site.each_context(request),
            "title": f"Run {flow.name}",
            "form": form,  # Pass 'form' directly
            "media": self.media + form.media,
            "opts": self.model._meta,
            "app_label": self.model._meta.app_label,
            "add": True,
            "change": False,
            "has_view_permission": self.has_view_permission(request),
            "has_add_permission": self.has_add_permission(request),
            "has_change_permission": False,
            "has_delete_permission": self.has_delete_permission(request),
        }

        return TemplateResponse(request, self.add_form_template, context)

    def get_workspace_id_from_request(self, request):
        """
        Extract the workspace ID from the URL.
        Assuming the URL structure is /workspaces/<workspace_id>/admin/...
        """
        path = request.path
        # Split the path and find the workspace ID
        try:
            parts = path.split("/")
            workspace_index = parts.index("workspaces") + 1
            workspace_id = parts[workspace_index]
            logger.debug(f"Extracted workspace_id: {workspace_id}")
            return workspace_id
        except (ValueError, IndexError) as e:
            logger.error(f"Error extracting workspace_id from URL: {e}")
            return None
