# bluewind/admin_autoregister.py

from django.apps import apps
from django.contrib.admin.sites import AlreadyRegistered
from workspaces.models import custom_admin_site  # Import your custom admin site

def autoregister():
    for app_config in apps.get_app_configs():
        for model in app_config.get_models():
            try:
                custom_admin_site.register(model)
            except AlreadyRegistered:
                pass

# Run the autoregister function
autoregister()