from bluewind.admin_site import custom_admin_site
from django.apps import apps
from django.contrib import admin
from django.contrib.admin.sites import AlreadyRegistered


def autoregister():
    for app_config in apps.get_app_configs():
        for model in app_config.get_models():
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
