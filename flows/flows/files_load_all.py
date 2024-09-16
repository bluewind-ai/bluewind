import logging
import os

from django.db import transaction

from files.models import File
from flows.flows.is_ignored_by_git import is_ignored_by_git

logger = logging.getLogger("django.not_used")


def files_load_all():
    logger.debug("Starting to process Python files...")

    base_dir = os.environ.get("BASE_DIR", ".")
    default_user_id = 1
    default_workspace_id = 1

    files_to_create = []
    files_to_update = []

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
        existing_files = File.objects.filter(path__in=[f.path for f in files_to_create])
        existing_paths = set(existing_files.values_list("path", flat=True))

        files_to_create = [f for f in files_to_create if f.path not in existing_paths]
        File.objects.bulk_create(files_to_create)

        for existing_file in existing_files:
            for new_file in files_to_create:
                if existing_file.path == new_file.path:
                    existing_file.content = new_file.content
                    files_to_update.append(existing_file)
                    break

        File.objects.bulk_update(files_to_update, ["content"])

    logger.debug(
        f"Processed {len(files_to_create)} new files and updated {len(files_to_update)} existing files."
    )
    logger.debug("Finished processing Python files.")
