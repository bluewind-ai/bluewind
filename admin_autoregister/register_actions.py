from django.apps import apps
from flows.models import Action, Model


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
            "action_type", "model_id"
        )
    )

    actions_to_create = []
    models_to_create = []

    for app_config in apps.get_app_configs():
        for model in app_config.get_models():
            model_instance, created = Model.objects.get_or_create(
                name=model._meta.model_name,
                app_label=model._meta.app_label,
                workspace=workspace,
                defaults={"name": model._meta.model_name},
            )

            if created:
                models_to_create.append(model_instance)

            for action_type in action_types:
                if (action_type, model_instance.id) not in registered_actions:
                    actions_to_create.append(
                        Action(
                            workspace=workspace,
                            action_type=action_type,
                            model=model_instance,
                        )
                    )

    if models_to_create:
        print(f"Registered {len(models_to_create)} new models")
    else:
        print("No new models to register")

    if actions_to_create:
        Action.objects.bulk_create(actions_to_create)
        print(f"Registered {len(actions_to_create)} new actions")
    else:
        print("No new actions to register")

    return len(models_to_create), len(actions_to_create)
