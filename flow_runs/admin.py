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
                f"Function or Form not found for {escape(flow_run.flow.name)}",
                level="error",
            )
            # Dynamic URL reversing
            app_label = self.model._meta.app_label
            model_name = self.model._meta.model_name
            url_name = f"admin:{app_label}_{model_name}_changelist"
            return redirect(reverse(url_name))

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

                flow_run.input_data = input_data
                flow_run.result = result
                flow_run.executed_at = timezone.now()
                flow_run.save()
                logger.debug(f"FlowRun saved with input_data: {flow_run.input_data}")

                # Display the result
                messages.info(request, f"Flow Result:\n{escape(result)}")
                return redirect(request.path)
            else:
                logger.debug(f"Form is invalid: {form.errors}")
        else:
            form = FormClass()
            logger.debug("Created new form instance")

        # Pass the form directly without AdminForm
        context = {
            **self.admin_site.each_context(request),
            "title": f"Run {flow.name}",
            "form": form,  # Pass 'form' instead of 'adminform'
            "object_id": object_id,
            "original": flow_run,
            "media": self.media + form.media,
            "opts": self.model._meta,
            "app_label": self.model._meta.app_label,
            "add": False,  # Since we're changing an existing object
            "change": True,  # We are in the change view
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
