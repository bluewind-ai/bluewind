# myapp/models.py

import logging

from django.apps import apps
from django.contrib.contenttypes.models import ContentType

from actions.models import Action

# Initialize the django.temp logger
temp_logger = logging.getLogger("django.temp")


def register_actions_and_models(workspace):
    action_types = [
        Action.ActionType.CREATE,
        Action.ActionType.SAVE,
        Action.ActionType.DELETE,
        Action.ActionType.LIST,
        Action.ActionType.SHOW,
    ]

    temp_logger.debug(
        f"Starting action registration for Workspace ID: {workspace.id}, Name: {workspace.name}"
    )

    # Fetch existing registered actions for the workspace
    registered_actions = set(
        Action.objects.filter(workspace=workspace).values_list(
            "action_type", "content_type_id"
        )
    )

    actions_to_create = []
    content_types_to_create = []

    # Iterate through all app configurations and their models
    for app_config in apps.get_app_configs():
        temp_logger.debug(f"Processing AppConfig: {app_config.name}")
        for model in app_config.get_models():
            # Skip abstract and proxy models if not needed
            if model._meta.abstract:
                temp_logger.debug(f"Skipping abstract model: {model.__name__}")
                continue
            if model._meta.proxy:
                temp_logger.debug(f"Skipping proxy model: {model.__name__}")
                continue

            temp_logger.debug(f"Processing model: {model.__name__}")

            # Get the ContentType for the model
            try:
                content_type = ContentType.objects.get_for_model(
                    model, for_concrete_model=False
                )
                temp_logger.debug(f"Retrieved ContentType: {content_type}")
            except ContentType.DoesNotExist:
                temp_logger.error(
                    f"ContentType does not exist for model: {model.__name__}"
                )
                continue

            # Optionally, track newly created ContentTypes
            if not ContentType.objects.filter(id=content_type.id).exists():
                content_types_to_create.append(content_type)
                temp_logger.debug(f"New ContentType to create: {content_type}")

            # Iterate through each action type
            for action_type in action_types:
                if (action_type, content_type.id) not in registered_actions:
                    # Determine if the action should be recorded
                    is_recorded = not (
                        model._meta.model_name.lower() == "actionrun"
                        and action_type == Action.ActionType.LIST
                    )
                    # Prepare the Action instance
                    action = Action(
                        workspace=workspace,
                        action_type=action_type,
                        content_type=content_type,
                        is_recorded=is_recorded,
                        user_id=1,  # Consider using a dynamic user or parameter
                    )
                    actions_to_create.append(action)
                    temp_logger.debug(f"Prepared Action: {action}")

    # Bulk create new ContentTypes if any (unlikely with get_for_model)
    if content_types_to_create:
        ContentType.objects.bulk_create(content_types_to_create)
        temp_logger.info(f"Registered {len(content_types_to_create)} new content types")
    else:
        temp_logger.info("No new content types to register")

    # Bulk create new Actions if any
    if actions_to_create:
        Action.objects.bulk_create(actions_to_create)
        temp_logger.info(f"Registered {len(actions_to_create)} new actions")
    else:
        temp_logger.info("No new actions to register")

    return len(content_types_to_create), len(actions_to_create)
