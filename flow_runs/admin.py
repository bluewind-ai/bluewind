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

from .models import FlowRun

logger = logging.getLogger("django.temp")


@admin.register(FlowRun)
class FlowRunAdmin(InWorkspace):
    change_form_template = "admin/flow_runs/flowrun/change_form.html"

    def changeform_view(self, request, object_id=None, form_url="", extra_context=None):
        logger.debug("Entered changeform_view")
        flow_run = self.get_object(request, object_id)
        if not flow_run:
            logger.debug("FlowRun object not found, using super().changeform_view")
            return super().changeform_view(request, object_id, form_url, extra_context)

        flow = flow_run.flow
        logger.debug(f"FlowRun found: {flow_run}, associated flow: {flow}")

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
            # Dynamic URL reversing
            app_label = self.model._meta.app_label
            model_name = self.model._meta.model_name
            url_name = f"admin:{app_label}_{model_name}_changelist"
            return redirect(reverse(url_name))

        def snake_to_pascal(snake_str):
            return "".join(word.title() for word in snake_str.split("_"))

        function_name = flow.name
        form_class_name = f"{snake_to_pascal(function_name)}Form"
        logger.debug(
            f"Function name: {function_name}, Form class name: {form_class_name}"
        )

        # Get the form class and the function
        FormClass = getattr(flow_module, form_class_name, None)
        function_to_run = getattr(flow_module, function_name, None)

        if not FormClass or not function_to_run:
            logger.error(f"Form or function not found in module {module_name}")
            self.message_user(
                request,
                f"Function or Form not found for {escape(flow_run.flow.name)}",
                level="error",
            )
            # Dynamic URL reversing
            app_label = self.model._meta.app_label
            model_name = self.model._meta.model_name
            url_name = f"admin:{app_label}_{model_name}_changelist"
            return redirect(reverse(url_name))

        if request.method == "POST":
            if "run" in request.POST:
                # Handle Run button
                form = FormClass(request.POST)
                logger.debug(f"POST request with data: {request.POST}")
                if form.is_valid():
                    logger.debug("Form is valid")
                    # Log cleaned data with types
                    for field, value in form.cleaned_data.items():
                        logger.debug(
                            f"Form field '{field}': {value} (Type: {type(value)})"
                        )

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

                    flow_run.input_data = input_data
                    flow_run.result = result
                    flow_run.executed_at = timezone.now()
                    flow_run.save()
                    logger.debug(
                        f"FlowRun saved with input_data: {flow_run.input_data}"
                    )

                    # Display the result
                    messages.info(request, f"Flow Result:\n{escape(result)}")
                    return redirect(request.path)
                else:
                    logger.debug(f"Form is invalid: {form.errors}")
            else:
                # Handle default admin save actions
                return super().changeform_view(
                    request, object_id, form_url, extra_context
                )
        else:
            # Initialize form with initial data, converting 'content_type' or 'content_type_id' to ContentType instance
            initial_data = flow_run.input_data.copy()
            logger.debug(f"Initial input_data before deserialization: {initial_data}")
            if "content_type" in initial_data:
                natural_key = initial_data["content_type"]
                try:
                    content_type = ContentType.objects.get_by_natural_key(*natural_key)
                    initial_data["content_type"] = content_type
                    logger.debug("Deserialized 'content_type' from natural key")
                except ContentType.DoesNotExist:
                    initial_data["content_type"] = None
                    logger.error(
                        f"ContentType with natural key {natural_key} does not exist."
                    )
            elif "content_type_id" in initial_data:
                try:
                    content_type = ContentType.objects.get(
                        id=initial_data["content_type_id"]
                    )
                    initial_data["content_type"] = content_type
                    logger.debug("Deserialized 'content_type' from content_type_id")
                except ContentType.DoesNotExist:
                    initial_data["content_type"] = None
                    logger.error(
                        f"ContentType with ID {initial_data['content_type_id']} does not exist."
                    )
            else:
                logger.debug(
                    "No 'content_type' or 'content_type_id' found in input_data"
                )

            form = FormClass(initial=initial_data)
            logger.debug("Created new form instance with initial data")

            # Log form fields for debugging
            for field in form.fields:
                logger.debug(
                    f"Form field '{field}': {form[field].value()} (Type: {type(form[field].value())})"
                )

        context = {
            **self.admin_site.each_context(request),
            "title": f"Run {flow.name}",
            "form": form,
            "object_id": object_id,
            "original": flow_run,
            "media": self.media + form.media,
            "opts": self.model._meta,
            "app_label": self.model._meta.app_label,
            "add": False,
            "change": True,
            "is_popup": False,
            "save_as": False,
            "has_view_permission": self.has_view_permission(request, flow_run),
            "has_change_permission": self.has_change_permission(request, flow_run),
            "has_add_permission": self.has_add_permission(request),
            "has_delete_permission": self.has_delete_permission(request, flow_run),
            "has_editable_inline_admin_formsets": False,
        }

        return TemplateResponse(
            request, "admin/flow_runs/flowrun/change_form.html", context
        )
