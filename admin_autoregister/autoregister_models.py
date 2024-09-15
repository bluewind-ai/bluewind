# myapp/models.py

import logging

from django.apps import apps

from models.models import Model  # Ensure your actual model import path

# Initialize the django.temp logger
temp_logger = logging.getLogger("django.temp")


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

            # Check if model is already registered
            if model_name not in registered_models:
                temp_logger.debug(
                    f"Model {model_name} is not registered, registering..."
                )

                # Prepare the Model instance
                model_instance = Model(
                    workspace=workspace,
                    name=model_name,
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
