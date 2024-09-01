from django.apps import AppConfig
from public_id.models import PREFIX_MAPPINGS


class BaseModelConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "base_model"

    def ready(self):
        from django.apps import apps

        for model in apps.get_models():
            if model.__name__ not in PREFIX_MAPPINGS:
                raise ValueError(
                    f"You didn't give a prefix for the model: {model.__name__}"
                )
