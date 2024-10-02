import logging
import os
import re

from django.db import transaction

from files.models import File
from functions.bluewind_function.v1.functions import bluewind_function_v1
from functions.models import Function

logger = logging.getLogger("django.not_used")


@bluewind_function_v1()
def get_function_or_create_from_file_v1(function_name):
    function = Function.objects.filter(name=function_name).first()
    if function:
        return function
    name_without_version = re.sub(r"_v\d+$", "", function_name)
    match = re.search(r"_v(\d+)$", function_name)
    version_number = int(match.group(1))
    base_dir = os.environ.get("BASE_DIR", ".")
    default_user_id = 1
    default_workspace_id = 1

    # Construct the file path
    file_path = os.path.join(
        base_dir,
        "functions",
        name_without_version,
        f"v{version_number}",
        "functions.py",
    )

    if not os.path.exists(file_path):
        raise_debug(f"File does not exist: {file_path}")

    # Read file content
    with open(file_path, "r") as file:
        content = file.read()

    # Create File object
    with transaction.atomic():
        file_obj = File.objects.create(
            path=file_path,
            content=content,
        )

        # Create Function object
        function = Function.objects.create(
            name=function_name,
            file=file_obj,
        )

    logger.info(f"Created function: {function_name}")

    return function
