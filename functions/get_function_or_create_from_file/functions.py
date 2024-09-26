import logging
import os

from django.db import transaction

from files.models import File
from functions.models import Function

logger = logging.getLogger("django.not_used")


def get_function_or_create_from_file(function_name, version_number):
    function = Function.objects.filter(
        name=function_name, version_number=version_number
    ).first()
    if function:
        return function
    logger.debug(f"Processing function: {function_name}, version: {version_number}")

    base_dir = os.environ.get("BASE_DIR", ".")
    default_user_id = 1
    default_workspace_id = 1

    # Construct the file path
    file_path = os.path.join(
        base_dir, "functions", function_name, f"v{version_number}", "functions.py"
    )

    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        return None

    # Read file content
    with open(file_path, "r") as file:
        content = file.read()

    # Create File object
    with transaction.atomic():
        file_obj = File.objects.create(
            path=file_path,
            content=content,
            user_id=default_user_id,
            workspace_id=default_workspace_id,
        )

        # Create Function object
        function = Function.objects.create(
            name=function_name,
            version_number=version_number,
            file=file_obj,
            user_id=default_user_id,
            workspace_id=default_workspace_id,
        )

    logger.info(f"Created function: {function_name}, version: {version_number}")

    return function
