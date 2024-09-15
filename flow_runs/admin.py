# flow_runs/admin.py
import importlib
import logging

from django.contrib import messages
from django.shortcuts import redirect
from django.template.response import TemplateResponse
from django.urls import reverse
from django.utils import timezone
from django.utils.html import escape

from base_model_admin.admin import InWorkspace

logger = logging.getLogger("django.temp")


# flow_runs/admin.py
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
                # Execute the function with form data
                result = function_to_run(**form.cleaned_data)
                logger.debug(f"Function executed, result: {result}")
                # Update the FlowRun instance
                flow_run.input_data = form.cleaned_data
                flow_run.result = result
                flow_run.executed_at = timezone.now()
                flow_run.save()
                # Display the result
                messages.info(request, f"Flow Result:\n{escape(result)}")
                return redirect(request.path)
            else:
                logger.debug("Form is invalid")
        else:
            form = FormClass()
            logger.debug("Created new form instance")

        # Remove admin_form creation
        # admin_form = admin.helpers.AdminForm(form, list([]), {})
        # logger.debug(f"Admin form created: {admin_form}")

        # Add the missing context variables
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
        logger.debug(f"Context prepared: {context}")

        return TemplateResponse(
            request, "admin/flow_runs/flowrun/change_form.html", context
        )
