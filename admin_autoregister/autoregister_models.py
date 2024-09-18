import logging
import os

from django.apps import apps
from django.conf import settings

from models.models import Model

# Initialize the django.temp logger
temp_logger = logging.getLogger("django.not_used")


def snake_case(s):
    """
    Helper function to convert CamelCase to snake_case.
    """
    return "".join(["_" + c.lower() if c.isupper() else c for c in s]).lstrip("_")


def register_all_models(workspace):
    """
    Register all models currently registered in the Django app registry.
    """
    temp_logger.debug(
        f"Starting model registration for Workspace ID: {workspace.id}, Name: {workspace.name}"
    )

    # Fetch existing registered models for the workspace
    registered_models = set(
        Model.objects.filter(workspace=workspace).values_list("name", flat=True)
    )

    models_to_create = []

    # Iterate through all app configurations and their models
    for app_config in apps.get_app_configs():
        temp_logger.debug(f"Processing AppConfig: {app_config.name}")
        for model in app_config.get_models():
            model_name = model.__name__
            app_label = app_config.label  # Extract the app label

            # Check if model is already registered
            if model_name not in registered_models:
                temp_logger.debug(
                    f"Model {model_name} is not registered, registering..."
                )

                # Construct the file path for the content
                file_path = os.path.join(settings.BASE_DIR, app_label, "models.py")

                # Read the content of the models.py file
                if os.path.exists(file_path):
                    temp_logger.debug(f"Read content from {file_path}")
                else:
                    temp_logger.warning(f"File {file_path} does not exist.")

                # Prepare the Model instance with app_label information
                model_instance = Model(
                    workspace=workspace,
                    name=model_name,
                    app_label=app_label,  # Include the app label
                    user_id=1,  # Consider using a dynamic user or parameter
                )
                models_to_create.append(model_instance)
                temp_logger.debug(f"Prepared Model Instance: {model_instance}")

    # Bulk create new Models if any
    if models_to_create:
        Model.objects.bulk_create(models_to_create)
        temp_logger.info(f"Registered {len(models_to_create)} new models")
    else:
        temp_logger.info("No new models to register")

    return len(models_to_create)
