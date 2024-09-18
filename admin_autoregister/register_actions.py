# myapp/models.py

import logging

from models.models import Model  # Import your specific models here

# Initialize the django.temp logger
temp_logger = logging.getLogger("django.not_used")

# myapp/models.py


# Initialize the django.temp logger
temp_logger = logging.getLogger("django.not_used")


def register_actions_and_models(workspace):
    model_classes = [Model]  # Add your model classes here

    temp_logger.debug(
        f"Starting model registration for Workspace ID: {workspace.id}, Name: {workspace.name}"
    )

    # Fetch existing registered models for the workspace
    registered_models = set(
        Model.objects.filter(workspace=workspace).values_list("name", flat=True)
    )

    models_to_create = []

    # Iterate through all models
    for model_class in model_classes:
        temp_logger.debug(f"Processing Model: {model_class.__name__}")

        # Check if model is already registered
        if model_class.__name__ not in registered_models:
            temp_logger.debug(
                f"Model {model_class.__name__} is not registered, registering..."
            )

            # Prepare the Model instance
            model_instance = model_class(
                workspace=workspace,
                name=model_class.__name__,
                user_id=1,  # Consider using a dynamic user or parameter
            )
            models_to_create.append(model_instance)
            temp_logger.debug(f"Prepared Model Instance: {model_instance}")

    # Bulk create new Models if any
    if models_to_create:
        model_class.objects.bulk_create(models_to_create)
        temp_logger.info(f"Registered {len(models_to_create)} new models")
    else:
        temp_logger.info("No new models to register")

    return len(models_to_create)
