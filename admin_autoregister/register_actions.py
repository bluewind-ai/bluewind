from django.apps import apps
from flows.models import Action, Model


def register_actions(workspace):
    action_types = [
        Action.ActionType.CREATE,
        Action.ActionType.SAVE,
        Action.ActionType.DELETE,
        Action.ActionType.LIST,
        Action.ActionType.SHOW,
    ]

    registered_actions = set(
        Action.objects.filter(workspace=workspace).values_list(
            "action_type", "model_id"
        )
    )

    actions_to_create = []

    for model in apps.get_models():
        model_instance, _ = Model.objects.get_or_create(
            name=model.__name__,
            app_label=model._meta.app_label,
            workspace=workspace,
            defaults={"name": model.__name__, "app_label": model._meta.app_label},
        )

        for action_type in action_types:
            if (action_type, model_instance.id) not in registered_actions:
                actions_to_create.append(
                    Action(
                        workspace=workspace,
                        action_type=action_type,
                        model=model_instance,
                    )
                )

    if actions_to_create:
        Action.objects.bulk_create(actions_to_create)
        print(f"Registered {len(actions_to_create)} new actions")
    else:
        print("No new actions to register")

    return len(actions_to_create)
