import logging
import os

from flows.models import Flow

temp_logger = logging.getLogger("django.debug")


def flows_create_from_file(file):
    # Update file content
    if os.path.exists(file.path):
        with open(file.path, "r") as f:
            file.content = f.read()
        file.save()

    if os.path.basename(file.path) == "flows.py":
        parent_dir = os.path.basename(os.path.dirname(file.path))
        Flow.objects.get_or_create(
            name=parent_dir,
            file=file,
            workspace=file.workspace,
            defaults={
                "user_id": file.user_id,
            },
        )

    # Log the action

    logger = logging.getLogger("django.debug")
    logger.debug(f"File created and processed: {file.path}")


"cdscds"
