import logging
import os

from bluewind.context_variables import get_function
from bluewind.utils import snake_case

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


# @bluewind_function_v1()
def select_or_create_model_v1(model_instance):
    from files.models import File
    from models.models import Model  # noqa: F401

    plural_model_name = model_instance._meta.app_label
    model = Model.objects.filter(plural_name=model_instance._meta.app_label).first()
    if model:
        return model
    singular_model_name = snake_case(model_instance.__class__.__name__)
    base_dir = os.environ.get("BASE_DIR", ".")

    # Construct the file path
    file_path = os.path.join(
        base_dir,
        plural_model_name,
        "models.py",
    )
    if not os.path.exists(file_path):
        raise Exception(f"File does not exist: {file_path}")

    # Read file content
    with open(file_path, "r") as file:
        content = file.read()
    file_obj = File.objects.create(
        path=file_path,
        content=content,
        user_id=1,
        workspace=get_workspace(),
    )

    # Create Function object
    model = Model.objects.create(
        plural_name=model_instance._meta.app_label,
        singular_name=singular_model_name,
        file=file_obj,
        function=get_function(),
        user_id=1,
        workspace=get_workspace(),
    )
