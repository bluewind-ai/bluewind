from django.apps import apps
from flows.models import Action, Flow, Model
from workspaces.models import Workspace


def register_actions():
    default_workspace = Workspace.objects.first()
    default_flow, _ = Flow.objects.get_or_create(
        name="Default Flow", workspace=default_workspace
    )

    action_types = [
        Action.ActionType.CREATE,
        Action.ActionType.SAVE,
        Action.ActionType.DELETE,
        Action.ActionType.LIST,
        Action.ActionType.SHOW,
    ]

    registered_actions = set(Action.objects.values_list("action_type", "model_id"))

    for model in apps.get_models():
        model_instance, _ = Model.objects.get_or_create(
            name=model.__name__,
            app_label=model._meta.app_label,
            workspace=default_workspace,
        )

        for action_type in action_types:
            if (action_type, model_instance.id) not in registered_actions:
                Action.objects.create(
                    flow=default_flow,
                    workspace=default_workspace,
                    action_type=action_type,
                    model=model_instance,
                )
                print(f"Registered new action: {action_type} on {model.__name__}")
