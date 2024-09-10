from django.apps import apps
from flows.models import Model


def insert_all_models(workspace):
    models_to_create = []

    for app_config in apps.get_app_configs():
        for model in app_config.get_models():
            models_to_create.append(
                Model(
                    name=model._meta.model_name,
                    app_label=model._meta.app_label,
                    workspace=workspace,
                )
            )

    created = Model.objects.bulk_create(models_to_create, ignore_conflicts=True)
    return len(created)
