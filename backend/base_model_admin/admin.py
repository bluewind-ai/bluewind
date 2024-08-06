from django.contrib import admin
from django.apps import apps
from django.contrib.admin.sites import AlreadyRegistered

# Get all installed apps
all_apps = apps.get_app_configs()

# Unregister models only from your custom apps
custom_apps = [app for app in all_apps if not app.name.startswith('django.') and not app.name.startswith('allauth')]

for app in custom_apps:
    for model in app.get_models():
        try:
            admin.site.unregister(model)
        except admin.sites.NotRegistered:
            pass

# Re-register models from your custom apps
for app in custom_apps:
    for model in app.get_models():
        try:
            admin.site.register(model)
        except AlreadyRegistered:
            pass

print(f"Registered models for apps: {[app.name for app in custom_apps]}")