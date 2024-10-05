import logging
import os
import sys

from django.apps import apps
from django.contrib import admin
from django.contrib.admin.sites import AlreadyRegistered
from django.db.migrations.recorder import MigrationRecorder

from base_model_admin.admin import InWorkspace
from bluewind.admin_site import custom_admin_site
from workspaces.models import WorkspaceRelated  # Adjust this import as needed

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def autoregister():
    def get_workspace_models():
        workspace_models = []
        for app_config in apps.get_app_configs():
            for model in app_config.get_models():
                if issubclass(model, WorkspaceRelated) and model != WorkspaceRelated:
                    workspace_models.append(model.__name__)
        return workspace_models

    workspace_models = get_workspace_models()
    app_configs = []

    for app_config in apps.get_app_configs():
        app_configs.append(app_config)
        app_label = app_config.label
        logger = logging.getLogger("django.not_used")

        for model in app_config.get_models():
            admin_class = None
            model_name = model.__name__
            admin_class_name = f"{model_name}Admin"

            # Try to find a custom Admin class in the same module as the model
            model_module = sys.modules[model.__module__]
            if hasattr(model_module, admin_class_name):
                admin_class = getattr(model_module, admin_class_name)

            # If no custom Admin class found, check in a separate admin.py file
            if not admin_class:
                try:
                    admin_module = __import__(
                        f"{app_label}.admin", fromlist=[admin_class_name]
                    )
                    if hasattr(admin_module, admin_class_name):
                        admin_class = getattr(admin_module, admin_class_name)
                except ImportError:
                    pass

            # If still no custom Admin class and model should use InWorkspace, create one
            if not admin_class and model_name in workspace_models:
                admin_class = type(admin_class_name, (InWorkspace,), {})

            # Register with custom admin site
            try:
                if admin_class:
                    custom_admin_site.register(model, admin_class)
                else:
                    custom_admin_site.register(model)
            except AlreadyRegistered:
                pass

            # Register with default admin site
            try:
                if admin_class:
                    admin.site.register(model, admin_class)
                else:
                    admin.site.register(model)
            except AlreadyRegistered:
                pass

    # Explicitly register the additional models

    custom_admin_site.register(MigrationRecorder.Migration)
