import importlib
import logging

from functions.get_form_or_create_from_file.v1.functions import (
    get_name_and_version_from_camel_case_name,
)

logger = logging.getLogger("django.not_used")


def import_form_using_db_object_v1(output_form_data):
    form_name = output_form_data.form.name
    snake_case_name_without_version, camel_case_name_without_version, version_number = (
        get_name_and_version_from_camel_case_name(output_form_data.form.name)
    )
    form_module = importlib.import_module(
        f"forms.{snake_case_name_without_version}.v{version_number}.forms"
    )

    return getattr(form_module, form_name)
