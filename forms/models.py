from base_model_admin.admin import InWorkspace
from django.apps import apps
from django.contrib import admin
from django.db import models
from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.urls import path
from workspaces.models import Workspace, WorkspaceRelated


class Form(WorkspaceRelated):
    name = models.CharField(max_length=255)

    def get_model_and_admin(self):
        model_name = self.name.replace("ModelForm", "")
        for app_config in apps.get_app_configs():
            try:
                model = app_config.get_model(model_name)
                model_admin = admin.site._registry[model]
                return model, model_admin
            except LookupError:
                continue

    def __str__(self):
        return f"{self.name}"


class WizardStep(WorkspaceRelated):
    name = models.CharField(max_length=255)
    form = models.ForeignKey(Form, on_delete=models.CASCADE)
    order = models.PositiveIntegerField()

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.name} (Step {self.order})"


class Wizard(WorkspaceRelated):
    name = models.CharField(max_length=255)
    steps = models.ManyToManyField(WizardStep)

    def __str__(self):
        return self.name


class WizardAdmin(InWorkspace):
    list_display = ("name",)

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "<int:wizard_id>/run/",
                self.admin_site.admin_view(self.run_wizard),
                name="run_wizard",
            ),
        ]
        return custom_urls + urls

    def run_wizard(self, request, wizard_id):
        wizard = Wizard.objects.get(id=wizard_id)
        steps = wizard.steps.all().order_by("order")

        if request.method == "POST":
            # Process the form submission
            form_model, form_admin = steps[0].form.get_model_and_admin()
            form_class = form_admin.get_form(request)
            form = form_class(request.POST)
            if form.is_valid():
                form.save()
                return HttpResponseRedirect(
                    "/admin/"
                )  # Redirect to admin home after completion
        else:
            # Display the form for the single step
            step = steps[0]
            form_model, form_admin = step.form.get_model_and_admin()
            form_class = form_admin.get_form(request)
            form = form_class()

        context = {
            "wizard": wizard,
            "step": step,
            "form": form,
            "current_step": 0,
            "total_steps": 1,
        }
        return render(request, "admin/run_wizard.html", context)


# Create instances


def create_channel_wizard(workspace=None):
    # Create Form instance for Channel
    if workspace is None:
        # Get or create a default workspace
        workspace, _ = Workspace.objects.get_or_create(id=1)

    # Create Form instance for Channel
    channel_form, _ = Form.objects.get_or_create(
        name="ChannelModelForm", workspace=workspace
    )

    # Create WizardStep instance
    wizard_step, _ = WizardStep.objects.get_or_create(
        name="Channel Configuration", form=channel_form, order=1, workspace=workspace
    )

    # Create Wizard instance
    channel_wizard, _ = Wizard.objects.get_or_create(
        name="Channel Setup Wizard", workspace=workspace
    )
    channel_wizard.steps.add(wizard_step)

    print(f"Created Channel Wizard: {channel_wizard}")
