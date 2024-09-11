from django.apps import apps
from django.contrib.contenttypes.models import ContentType
from flows.models import Action


def register_actions_and_models(workspace):
    action_types = [
        Action.ActionType.CREATE,
        Action.ActionType.SAVE,
        Action.ActionType.DELETE,
        Action.ActionType.LIST,
        Action.ActionType.SHOW,
    ]

    registered_actions = set(
        Action.objects.filter(workspace=workspace).values_list(
            "action_type", "content_type_id"
        )
    )

    actions_to_create = []
    content_types_to_create = []

    for app_config in apps.get_app_configs():
        for model in app_config.get_models():
            content_type, created = ContentType.objects.get_or_create(
                model=model._meta.model_name,
                app_label=model._meta.app_label,
            )

            if created:
                content_types_to_create.append(content_type)

            for action_type in action_types:
                if (action_type, content_type.id) not in registered_actions:
                    # Set is_recorded to False for ActionRun LIST action
                    is_recorded = not (
                        model._meta.model_name == "actionrun"
                        and action_type == Action.ActionType.LIST
                    )
                    actions_to_create.append(
                        Action(
                            workspace=workspace,
                            action_type=action_type,
                            content_type=content_type,
                            is_recorded=is_recorded,
                        )
                    )

    if content_types_to_create:
        print(f"Registered {len(content_types_to_create)} new content types")
    else:
        print("No new content types to register")

    if actions_to_create:
        Action.objects.bulk_create(actions_to_create)
        print(f"Registered {len(actions_to_create)} new actions")
    else:
        print("No new actions to register")

    return len(content_types_to_create), len(actions_to_create)
