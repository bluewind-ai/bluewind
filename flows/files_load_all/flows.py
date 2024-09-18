import json
import logging
import os

from flows.load_and_process_files.flows import load_and_process_files

logger = logging.getLogger("django.not_used")


def files_load_all():
    logger.debug("Starting to process Python files and register models...")

    base_dir = os.environ.get("BASE_DIR", ".")
    default_user_id = 1
    default_workspace_id = 1
    installed_apps = json.loads(os.environ["CUSTOM_APPS"])
    return load_and_process_files(
        base_dir, installed_apps, default_user_id, default_workspace_id
    )
