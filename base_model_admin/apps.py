from django.apps import AppConfig


class BaseModelAdminConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "base_model_admin"
