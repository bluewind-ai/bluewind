import logging
import os

from django.apps import apps
from django.db import transaction

from files.models import File
from flows.flows.is_ignored_by_git import is_ignored_by_git
from models.models import Model

logger = logging.getLogger("django.not_used")


def files_load_all():
    logger.debug("Starting to process Python files and register models...")

    base_dir = os.environ.get("BASE_DIR", ".")
    default_user_id = 1
    default_workspace_id = 1

    files_to_create = []
    files_to_update = []
    models_to_create = []

    for root, dirs, files in os.walk(base_dir):
        for file_name in files:
            if file_name.endswith(".py"):
                file_path = os.path.join(root, file_name)
                if not is_ignored_by_git(file_path):
                    with open(file_path, "r") as file:
                        content = file.read()

                    file_obj = File(
                        path=file_path,
                        content=content,
                        user_id=default_user_id,
                        workspace_id=default_workspace_id,
                    )
                    files_to_create.append(file_obj)

    with transaction.atomic():
        # Process files
        existing_files = File.objects.filter(path__in=[f.path for f in files_to_create])
        existing_paths = set(existing_files.values_list("path", flat=True))

        files_to_create = [f for f in files_to_create if f.path not in existing_paths]
        created_files = File.objects.bulk_create(files_to_create)

        for existing_file in existing_files:
            for new_file in files_to_create:
                if existing_file.path == new_file.path:
                    existing_file.content = new_file.content
                    files_to_update.append(existing_file)
                    break

        File.objects.bulk_update(files_to_update, ["content"])

        # Register models
        all_files = list(existing_files) + created_files
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

    logger.debug(
        f"Processed {len(files_to_create)} new files, updated {len(files_to_update)} existing files, "
        f"and registered {len(models_to_create)} new models."
    )
    logger.debug("Finished processing Python files and registering models.")

    return len(files_to_create), len(files_to_update), len(models_to_create)
