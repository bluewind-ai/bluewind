import logging
import os

from django.db.models import Q

from files.models import File

logger = logging.getLogger("django.debug")


def directory_system_changes(file_system_change):
    logger.debug(
        f"Directory change ({file_system_change.change_type}) detected for {file_system_change.source_path}"
    )

    user = file_system_change.workspace.user

    if file_system_change.change_type == "created":
        # Create File objects for all resources one level deep
        directory_path = file_system_change.source_path
        for item in os.listdir(directory_path):
            item_path = os.path.join(directory_path, item)
            File.objects.create(
                workspace=file_system_change.workspace,
                path=item_path,
                content="",
                user=user,
            )

    elif file_system_change.change_type == "deleted":
        # Delete all resources just under (one level deep)
        directory_path = file_system_change.source_path
        File.objects.filter(
            Q(workspace=file_system_change.workspace)
            & Q(path__startswith=directory_path)
            & ~Q(path__contains=os.sep, path__startswith=directory_path + os.sep)
        ).delete()

    elif file_system_change.change_type == "modified":
        # Placeholder function for complex directory modification
        handle_complex_directory_modification(file_system_change)

    logger.info(
        f"Finished handling directory change for: {file_system_change.source_path}"
    )


def handle_complex_directory_modification(file_system_change):
    # Placeholder function for complex directory modification
    logger.info(f"Complex directory modification for: {file_system_change.source_path}")
    # Implementation to be added later
    pass
