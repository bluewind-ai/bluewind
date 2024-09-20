import logging
import os

from files.models import File
from flows.directory_system_changes.flows import directory_system_changes

logger = logging.getLogger("django.temp")


def file_system_changes_after_create(file_change):
    logger.debug(
        f"FileChange ({file_change.change_type}) detected for {file_change.source_path}"
    )

    if os.path.isdir(file_change.source_path):
        return directory_system_changes(file_change)

    # Assuming the workspace has a user associated with it
    user = file_change.workspace.user  # Adjust this based on your actual data model

    if file_change.change_type == "created":
        # Create a new File object based on the FileChange
        File.objects.create(
            workspace=file_change.workspace,
            path=file_change.source_path,
            content="",
            user=user,  # Add the user here
        )
    elif file_change.change_type == "modified":
        # Update the existing File object
        file, created = File.objects.get_or_create(
            workspace=file_change.workspace,
            path=file_change.source_path,
            defaults={"user": user},  # Add user to defaults
        )
        if not created:
            # You might want to update the file content here
            file.save()
    elif file_change.change_type == "deleted":
        # Delete the corresponding File object
        File.objects.filter(
            workspace=file_change.workspace, path=file_change.source_path
        ).delete()

    # Additional logic can be added here for other change types or actions


"cds"
