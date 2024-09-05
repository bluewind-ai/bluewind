from django.apps import apps
from django.contrib import admin
from django.db import models
from workspaces.models import WorkspaceRelated


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
        return None, None

    def __str__(self):
        return self.name


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


# Admin classes

from base_model_admin.admin import InWorkspace
from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.urls import path, reverse


class FormAdmin(InWorkspace):
    def change_view(self, request, object_id, form_url="", extra_context=None):
        form = self.get_object(request, object_id)
        _, model_admin = form.get_model_and_admin()
        return model_admin.add_view(request)


class WizardAdmin(InWorkspace):
    def change_view(self, request, object_id, form_url="", extra_context=None):
        wizard = self.get_object(request, object_id)
        steps = wizard.steps.all().order_by("order")
        first_step = steps.first()
        model, model_admin = first_step.form.get_model_and_admin()

        context = model_admin.add_view(request)
        if isinstance(context, HttpResponseRedirect):
            return context

        context.context_data["title"] = (
            f"Add {model._meta.verbose_name} (Wizard: {wizard.name})"
        )
        return context

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "<int:wizard_id>/run/",
                self.admin_site.admin_view(self.run_wizard),
                name="admin_wizard_run",
            ),
        ]
        return custom_urls + urls

    def run_wizard(self, request, wizard_id):
        wizard = Wizard.objects.get(id=wizard_id)
        steps = wizard.steps.all().order_by("order")

        if request.method == "POST":
            form_model, form_admin = steps[0].form.get_model_and_admin()
            form_class = form_admin.get_form(request)
            form = form_class(request.POST)
            if form.is_valid():
                form.save()
                return HttpResponseRedirect(reverse("admin:forms_wizard_add"))
        else:
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


# Helper function

from workspaces.models import Workspace


def create_channel_wizard(workspace=None):
    workspace, _ = Workspace.objects.get_or_create(id=1)
    channel_form, _ = Form.objects.get_or_create(
        name="ChannelModelForm", workspace=workspace
    )
    wizard_step, _ = WizardStep.objects.get_or_create(
        name="Channel Configuration", form=channel_form, order=1, workspace=workspace
    )
    channel_wizard, _ = Wizard.objects.get_or_create(
        name="Channel Setup Wizard", workspace=workspace
    )
    channel_wizard.steps.add(wizard_step)
