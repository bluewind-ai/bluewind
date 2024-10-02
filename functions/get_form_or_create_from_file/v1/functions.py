import logging
import os
import re

from files.models import File
from forms.models import Form

logger = logging.getLogger("django.not_used")


def get_name_and_version_from_camel_case_name(camel_case_name):
    # Split the name and version
    match = re.match(r"(.+)V(\d+)$", camel_case_name)

    if not match:
        raise ValueError(
            f"Invalid format: {camel_case_name}. Expected format: NameInCamelCaseV<number>"
        )

    camel_case_name = match.group(1)
    version = int(match.group(2))

    # Convert CamelCase to snake_case
    snake_case_name = re.sub(r"(?<!^)(?=[A-Z])", "_", camel_case_name).lower()

    return snake_case_name, camel_case_name, version


def get_form_or_create_from_file_v1(form_object):
    if not form_object:
        return None
    form_name = form_object.__name__
    form = Form.objects.filter(name=form_name).first()
    if form:
        return form
    snake_case_name_without_version, camel_case_name_without_version, version_number = (
        get_name_and_version_from_camel_case_name(form_name)
    )
    # raise Exception(
    #     snake_case_name_without_version, camel_case_name_without_version, version_number
    # )
    base_dir = os.environ.get("BASE_DIR", ".")
    default_user_id = 1
    default_workspace_id = 1

    # Construct the file path
    file_path = os.path.join(
        base_dir,
        "forms",
        snake_case_name_without_version,
        f"v{version_number}",
        "forms.py",
    )

    # Read file content
    with open(file_path, "r") as file:
        content = file.read()

    # Create File object and Form object
    file_obj = File.objects.create(
        path=file_path,
        content=content,
        user_id=default_user_id,
        workspace_id=default_workspace_id,
    )

    form = Form.objects.create(
        name=form_name,
        file=file_obj,
        user_id=default_user_id,
        workspace_id=default_workspace_id,
    )

    logger.info(f"Created form: {form_name}")

    return form
