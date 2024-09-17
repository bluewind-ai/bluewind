import logging
import os

from django.apps import apps

from models.models import Model

logger = logging.getLogger("django.not_used")


def register_models(base_dir, default_workspace_id, default_user_id, all_files):
    models_to_create = []
    file_dict = {file.path: file for file in all_files}
    registered_models = set(Model.objects.values_list("name", flat=True))

    for app_config in apps.get_app_configs():
        for model in app_config.get_models():
            model_name = model.__name__
            app_label = app_config.label
            file_path = os.path.join(base_dir, app_label, "models.py")

            if model_name not in registered_models and file_path in file_dict:
                file_instance = file_dict[file_path]
                model_instance = Model(
                    workspace_id=default_workspace_id,
                    name=model_name,
                    app_label=app_label,
                    user_id=default_user_id,
                    file=file_instance,
                )
                models_to_create.append(model_instance)

    Model.objects.bulk_create(models_to_create)
    return models_to_create
