import os
from django.apps import AppConfig
from django.contrib import admin
from django.conf import settings

class BaseAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'base_app_config'

    def ready(self):
        # This code runs when Django starts
        from base_model_admin.admin import BaseAdminModel  # Import here to avoid circular imports
        
        # Get all models from your app
        app_models = self.get_models()
        
        # Register each model with BaseAdminModel
        for model in app_models:
            if not admin.site.is_registered(model):
                admin.site.register(model, BaseAdminModel)

        # Auto-discover and register apps
        self.auto_discover_apps()

    def auto_discover_apps(self):
        base_dir = settings.BASE_DIR
        for item in os.listdir(base_dir):
            if self.is_django_app(os.path.join(base_dir, item)):
                app_name = f'{item}'
                if app_name not in settings.INSTALLED_APPS:
                    settings.INSTALLED_APPS.append(app_name)
                    print(f"Discovered and added app: {app_name}")

    def is_django_app(self, path):
        return os.path.isdir(path) and (
            os.path.exists(os.path.join(path, 'apps.py')) or
            os.path.exists(os.path.join(path, 'models.py'))
        )