import logging
import os

from django.apps import apps
from django.db import IntegrityError

from models.models import Model

logger = logging.getLogger("django.debug")


def register_models(base_dir, default_workspace_id, default_user_id, all_files):
    models_created = []
    file_dict = {file.path: file for file in all_files}
    existing_models = {model.file_id: model for model in Model.objects.all()}

    for app_config in apps.get_app_configs():
        app_label = app_config.label
        file_path = os.path.join(base_dir, app_label, "models.py")

        if file_path in file_dict:
            file_instance = file_dict[file_path]

            if file_instance.id not in existing_models:
                model_instance = Model(
                    workspace_id=default_workspace_id,
                    app_label=app_label,
                    user_id=default_user_id,
                    file=file_instance,
                )
                try:
                    model_instance.save()
                    models_created.append(model_instance)
                except IntegrityError:
                    logger.warning(
                        f"Model for file {file_path} already exists. Skipping."
                    )
            else:
                logger.info(f"Model for file {file_path} already exists. Skipping.")

    return models_created
