import logging

from files.models import File

logger = logging.getLogger("django.temp")


logger = logging.getLogger("django.temp")


logger = logging.getLogger("django.temp")


logger = logging.getLogger("django.temp")


logger = logging.getLogger("django.temp")


logger = logging.getLogger("django.temp")


logger = logging.getLogger("django.temp")


def handle_file_change(file_system_change):
    user = file_system_change.workspace.user
    file_path = file_system_change.source_path

    logger.info(
        f"Handling file change: {file_system_change.change_type} for {file_path}"
    )

    if file_system_change.change_type == "created":
        logger.debug(f"Reading content of newly created file: {file_path}")
        with open(file_path, "r") as file:
            content = file.read()
        logger.debug(f"Creating new File object for: {file_path}")
        File.objects.create(
            workspace=file_system_change.workspace,
            path=file_path,
            content=content,
            user=user,
        )
        logger.info(f"New File object created for: {file_path}")

    elif file_system_change.change_type == "modified":
        logger.debug(f"Updating File object for: {file_path}")
        file = File.objects.get(
            workspace=file_system_change.workspace,
            path=file_path,
        )
        with open(file_path, "r") as f:
            file.content = f.read()
        file.save()
        logger.info(f"File object updated with new content: {file_path}")

    elif file_system_change.change_type == "deleted":
        logger.debug(f"Deleting File object for: {file_path}")
        File.objects.filter(
            workspace=file_system_change.workspace, path=file_path
        ).delete()
        logger.info(f"File object deleted for: {file_path}")

    logger.info(f"Finished handling file change for: {file_path}")


"cdcds"
