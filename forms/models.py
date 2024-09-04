from base_model_admin.admin import InWorkspace
from django.apps import apps
from django.contrib import admin
from django.db import models
from workspaces.models import WorkspaceRelated


class Form(WorkspaceRelated):
    name = models.CharField(max_length=255)  # This stores the model name

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


class FormAdmin(InWorkspace):
    def change_view(self, request, object_id, form_url="", extra_context=None):
        form = self.get_object(request, object_id)
        _, model_admin = form.get_model_and_admin()
        return model_admin.add_view(request)
