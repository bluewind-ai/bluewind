import logging
import os

from files.models import File

logger = logging.getLogger("django.temp")


def file_system_changes_after_create(file_system_change):
    logger.debug(
        f"FileChange ({file_system_change.change_type}) detected for {file_system_change.source_path}"
    )

    # Check if the path is a directory
    if os.path.isdir(file_system_change.source_path):
        return directory_system_changes(file_system_change)

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
            user=user,  # Add the user here
        )
    elif file_system_change.change_type == "modified":
        # Update the existing File object
        file, created = File.objects.get_or_create(
            workspace=file_system_change.workspace,
            path=file_system_change.source_path,
            defaults={"user": user},  # Add user to defaults
        )
        if not created:
            # You might want to update the file content here
            file.save()
    elif file_system_change.change_type == "deleted":
        # Delete the corresponding File object
        File.objects.filter(
            workspace=file_system_change.workspace, path=file_system_change.source_path
        ).delete()

    # Additional logic can be added here for other change types or actions


def directory_system_changes(file_system_change):
    logger.debug(
        f"Directory change ({file_system_change.change_type}) detected for {file_system_change.source_path}"
    )

    user = file_system_change.workspace.user

    if file_system_change.change_type == "created":
        # Create a new Directory object or flag in your File model
        File.objects.create(
            workspace=file_system_change.workspace,
            path=file_system_change.source_path,
            content="",
            user=user,
            is_directory=True,  # Assuming you have this field
        )
    elif file_system_change.change_type == "deleted":
        # Delete the directory and all files within it
        File.objects.filter(
            workspace=file_system_change.workspace,
            path__startswith=file_system_change.source_path,
        ).delete()
    elif file_system_change.change_type == "modified":
        # Handle directory modification (e.g., rename)
        # This might involve updating the paths of all files within the directory
        old_path = file_system_change.source_path
        new_path = (
            file_system_change.destination_path
        )  # Assuming this exists in your model
        if new_path:
            files_to_update = File.objects.filter(
                workspace=file_system_change.workspace, path__startswith=old_path
            )
            for file in files_to_update:
                file.path = file.path.replace(old_path, new_path, 1)
                file.save()

    # Additional logic for other directory-specific operations can be added here


"ccds"
