import logging
import os
import re

from django.db import transaction

from files.models import File
from forms.models import Form

logger = logging.getLogger("django.not_used")


def get_form_or_create_from_file(form_name):
    form = Form.objects.filter(name=form_name).first()
    if form:
        return form

    name_without_version = re.sub(r"_v\d+$", "", form_name)
    match = re.search(r"_v(\d+)$", form_name)
    version_number = int(match.group(1))
    base_dir = os.environ.get("BASE_DIR", ".")
    default_user_id = 1
    default_workspace_id = 1

    # Construct the file path
    file_path = os.path.join(
        base_dir,
        "forms",
        name_without_version,
        f"v{version_number}",
        "form.py",
    )

    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        return None

    # Read file content
    with open(file_path, "r") as file:
        content = file.read()

    # Create File object and Form object
    with transaction.atomic():
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
