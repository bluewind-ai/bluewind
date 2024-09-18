import json

from django.apps import apps
from django.core import serializers

from workspaces.models import WorkspaceRelated


def workspace_snapshots_before_create(instance):
    all_data = {}

    blacklist = instance.get_snapshot_blacklist()

    # Get all models in the project
    for model in apps.get_models():
        # Check if the model is related to WorkspaceRelated and is not blacklisted
        model_str = f"{model._meta.app_label}.{model._meta.object_name}"

        if issubclass(model, WorkspaceRelated) and model_str not in blacklist:
            # Get all objects of this model related to this workspace
            objects = model.objects.filter(workspace=instance.workspace)

            # Serialize the objects to JSON
            serialized_data = serializers.serialize("json", objects)

            # Parse the serialized data to ensure it's valid JSON
            json_data = json.loads(serialized_data)

            # Add the data to the all_data dictionary
            all_data[model.__name__] = json_data

    # Assign the JSON data to the data field
    instance.data = all_data
