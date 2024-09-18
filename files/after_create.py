import os

from flows.models import Flow


def files_after_create(file):
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
    from django.utils.log import getLogger

    logger = getLogger("django.debug")
    logger.debug(f"File created and processed: {file.path}")
