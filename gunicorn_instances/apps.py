from django.apps import AppConfig


class GunicornInstancesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "gunicorn_instances"
