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
