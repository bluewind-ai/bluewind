import logging
import os

from files.models import File
from flows.directory_system_changes.flows import directory_system_changes

logger = logging.getLogger("django.temp")


def file_system_changes_after_create(file_system_change):
    logger.debug(
        f"FileChange ({file_system_change.change_type}) detected for {file_system_change.source_path}"
    )

    if os.path.isdir(file_system_change.source_path):
        return directory_system_changes(file_system_change)
    return handle_file_change(file_system_change)


def handle_file_change(file_system_change):
    # Assuming the workspace has a user associated with it
    user = (
        file_system_change.workspace.user
    )  # Adjust this based on your actual data model

    if file_system_change.change_type == "created":
        # Create a new File object based on the FileChange
        File.objects.create(
            workspace=file_system_change.workspace,
            path=file_system_change.source_path,
            content="",
            user=user,
        )
    elif file_system_change.change_type == "modified":
        # Update the existing File object
        file, created = File.objects.get_or_create(
            workspace=file_system_change.workspace,
            path=file_system_change.source_path,
            defaults={"user": user},
        )
        if not created:
            # You might want to update the file content here
            file.save()
    elif file_system_change.change_type == "deleted":
        # Delete the corresponding File object
        File.objects.filter(
            workspace=file_system_change.workspace, path=file_system_change.source_path
        ).delete()
