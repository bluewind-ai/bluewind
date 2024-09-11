import json

from django.apps import apps
from django.core import serializers
from django.db import models
from workspaces.models import (
    WorkspaceRelated,  # Adjust this import based on your project structure
)


class WorkspaceSnapshot(WorkspaceRelated):
    created_at = models.DateTimeField(auto_now_add=True)
    data = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"Dump for {self.workspace} at {self.created_at}"

    def save(self, *args, **kwargs):
        all_data = {}

        # Get all models in the project
        for model in apps.get_models():
            # Check if the model is related to WorkspaceRelated
            if issubclass(model, WorkspaceRelated) and model != WorkspaceSnapshot:
                # Get all objects of this model related to this workspace
                objects = model.objects.filter(workspace=self.workspace)

                # Serialize the objects to JSON
                serialized_data = serializers.serialize("json", objects)

                # Parse the serialized data to ensure it's valid JSON
                json_data = json.loads(serialized_data)

                # Add the data to the all_data dictionary
                all_data[model.__name__] = json_data

        # Assign the JSON data to the data field
        self.data = all_data

        # Call the original save method after assigning the JSON data
        super().save(*args, **kwargs)
