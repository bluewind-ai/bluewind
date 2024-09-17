import json
import logging
import os

from django.db import transaction

from flows.load_and_process_files.flows import load_and_process_files
from flows.register_models.flows import register_models

logger = logging.getLogger("django.not_used")


def files_load_all():
    logger.debug("Starting to process Python files and register models...")

    base_dir = os.environ.get("BASE_DIR", ".")
    default_user_id = 1
    default_workspace_id = 1
    installed_apps = json.loads(os.environ["CUSTOM_APPS"])

    with transaction.atomic():
        existing_files, created_files, files_to_update = load_and_process_files(
            base_dir, installed_apps, default_user_id, default_workspace_id
        )
        all_files = list(existing_files) + created_files
        models_to_create = register_models(
            base_dir, default_workspace_id, default_user_id, all_files
        )

    logger.debug(
        f"Processed {len(created_files)} new files, updated {len(files_to_update)} existing files, "
        f"and registered {len(models_to_create)} new models."
    )
    logger.debug("Finished processing Python files and registering models.")

    return len(created_files), len(files_to_update), len(models_to_create)
