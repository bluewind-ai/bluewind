from django.contrib import admin
from django.apps import apps
from django.contrib.admin.sites import AlreadyRegistered

def get_all_fields_and_properties(model):
    fields = [field.name for field in model._meta.fields]
    properties = [name for name, value in vars(model).items() if isinstance(value, property)]
    return fields + properties

class AutoListDisplayAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        return get_all_fields_and_properties(self.model)


# Get all installed apps
all_apps = apps.get_app_configs()

# Filter for your custom apps
custom_apps = [app for app in all_apps if not app.name.startswith('django.') and not app.name.startswith('allauth')]

# Keep track of models we've seen
registered_models = set()

for app in custom_apps:
    for model in app.get_models():
        if model not in registered_models:
            try:
                admin.site.register(model, AutoListDisplayAdmin)
                registered_models.add(model)
                print(f"Registered {model.__name__} from {app.name} with AutoListDisplayAdmin")
            except AlreadyRegistered:
                print(f"{model.__name__} from {app.name} is already registered")
                registered_models.add(model)

print(f"Processed models for apps: {[app.name for app in custom_apps]}")