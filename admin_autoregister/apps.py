from django.apps import AppConfig


class AdminAutoregisterConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "admin_autoregister"

    def ready(self):
        from admin_autoregister.models import autoregister

        autoregister()
