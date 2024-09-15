# flow_runs/admin.py
import importlib

from django.contrib import admin, messages
from django.shortcuts import redirect
from django.template.response import TemplateResponse
from django.urls import reverse
from django.utils import timezone

from base_model_admin.admin import InWorkspace


class FlowRunAdmin(InWorkspace):
    change_form_template = "admin/change_form.html"

    def changeform_view(self, request, object_id=None, form_url="", extra_context=None):
        flow_run = self.get_object(request, object_id)
        if not flow_run:
            return super().changeform_view(request, object_id, form_url, extra_context)

        flow = flow_run.flow

        # Dynamically import the flow definition module
        module_name = f"flows.flows.{flow.name}"  # Updated module path
        try:
            flow_module = importlib.import_module(module_name)
        except ImportError:
            self.message_user(
                request, f"Module {module_name} not found.", level="error"
            )
            # Dynamic URL reversing
            app_label = self.model._meta.app_label
            model_name = self.model._meta.model_name
            url_name = f"admin:{app_label}_{model_name}_changelist"
            return redirect(reverse(url_name))

        def snake_to_pascal(snake_str):
            return "".join(word.title() for word in snake_str.split("_"))

        function_name = flow.name  # e.g., 'get_model_context'
        form_class_name = (
            f"{snake_to_pascal(function_name)}Form"  # 'GetModelContextForm'
        )

        # Get the form class and the function
        FormClass = getattr(flow_module, form_class_name, None)
        function_to_run = getattr(flow_module, function_name, None)

        if not FormClass or not function_to_run:
            self.message_user(
                request,
                f"Function or Form not found for {flow_run.flow.name}",
                level="error",
            )
            # Dynamic URL reversing
            app_label = self.model._meta.app_label
            model_name = self.model._meta.model_name
            url_name = f"admin:{app_label}_{model_name}_changelist"
            return redirect(reverse(url_name))

        if request.method == "POST":
            form = FormClass(request.POST)
            if form.is_valid():
                # Execute the function with form data
                result = function_to_run(**form.cleaned_data)
                # Update the FlowRun instance
                flow_run.input_data = form.cleaned_data
                flow_run.result = result
                flow_run.executed_at = timezone.now()
                flow_run.save()
                # Display the result
                messages.info(request, f"Flow Result:\n{result}")
                return redirect(request.path)
        else:
            form = FormClass()

        admin_form = admin.helpers.AdminForm(form, list([]), {})

        context = {
            **self.admin_site.each_context(request),
            "title": f"Run {flow.name}",
            "adminform": admin_form,
            "object_id": object_id,
            "original": flow_run,
            "media": self.media + admin_form.media,
            "opts": self.model._meta,
            "app_label": self.model._meta.app_label,
        }

        return TemplateResponse(request, "admin/change_form.html", context)
