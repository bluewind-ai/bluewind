import os
import sys

from admin_autoregister.admin_inheritance import check_admin_inheritance
from admin_autoregister.model_inheritance import check_model_inheritance
from base_model_admin.admin import InWorkspace
from bluewind.admin_site import custom_admin_site
from django.apps import apps
from django.contrib import admin
from django.contrib.admin.sites import AlreadyRegistered
from django.db.migrations.recorder import MigrationRecorder
from workspaces.models import WorkspaceRelated  # Adjust this import as needed

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def append_to_dockerignore(app_configs):
    dockerignore_path = os.path.join(base_dir, ".dockerignore")

    with open(dockerignore_path, "a") as f:
        for app_config in app_configs:
            f.write(f"!{app_config.label}\n")


def clean_dockerignore():
    dockerignore_path = os.path.join(base_dir, ".dockerignore")

    with open(dockerignore_path, "r") as f:
        lines = f.readlines()

    # Keep the first line (assumed to be the wildcard *)
    first_line = lines[0] if lines else ""

    # Remove duplicates and sort the rest of the lines
    unique_sorted_lines = sorted(set(lines[1:]))

    # Write back to the file
    with open(dockerignore_path, "w") as f:
        f.write(first_line)  # Write the first line (wildcard) unchanged
        f.writelines(unique_sorted_lines)  # Write the rest of the sorted, unique lines

    print(
        "Dockerignore file has been cleaned and sorted (keeping the first line intact)."
    )
    # remove the last


def get_workspace_models():
    workspace_models = []
    for app_config in apps.get_app_configs():
        for model in app_config.get_models():
            if issubclass(model, WorkspaceRelated) and model != WorkspaceRelated:
                workspace_models.append(model.__name__)
    return workspace_models


def autoregister():
    workspace_models = get_workspace_models()
    app_configs = []

    for app_config in apps.get_app_configs():
        app_configs.append(app_config)
        app_label = app_config.label
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
    additional_models = [MigrationRecorder.Migration]

    for model in additional_models:
        try:
            custom_admin_site.register(model)
        except AlreadyRegistered:
            pass
        try:
            admin.site.register(model)
        except AlreadyRegistered:
            pass

    append_to_dockerignore(app_configs)
    clean_dockerignore()
    check_admin_inheritance()
    check_model_inheritance()
    # register_forms()
    # register_actions()  # Add this line

    # create_channel_wizard()
    # inserted_count = Model.insert_all_models()
    # print(f"Inserted {inserted_count} models into the Model table.")
