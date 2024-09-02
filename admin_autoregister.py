import sys

from bluewind.admin_site import custom_admin_site
from django.apps import apps
from django.contrib import admin
from django.contrib.admin.sites import AlreadyRegistered
from django.db.migrations.recorder import MigrationRecorder


def autoregister():
    for app_config in apps.get_app_configs():
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


# Run the autoregister function
autoregister()
