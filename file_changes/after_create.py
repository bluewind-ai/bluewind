import logging

from files.models import File

logger = logging.getLogger("django.temp")


def file_changes_after_create(file_change):
    logger.debug(
        f"FileChange ({file_change.change_type}) detected for {file_change.source_path}"
    )
    if file_change.change_type == "created":
        # Create a new File object based on the FileChange
        File.objects.create(
            workspace=file_change.workspace,
            path=file_change.source_path,
            content="",  # You might want to read the actual file content here
        )
    elif file_change.change_type == "modified":
        # Update the existing File object
        file, created = File.objects.get_or_create(
            workspace=file_change.workspace, path=file_change.source_path
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
    # if file_change.change_type == "created":
