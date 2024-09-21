from django.apps import AppConfig


class AdminAutoregisterConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "admin_autoregister"

    def ready(self):
        from bluewind.context_variables import set_workspace_id

        set_workspace_id(1)

        from admin_autoregister.models import autoregister

        autoregister()
