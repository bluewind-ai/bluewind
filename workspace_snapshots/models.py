import json

from django.apps import apps
from django.core import serializers
from django.db import models
from workspaces.models import WorkspaceRelated


class WorkspaceSnapshot(WorkspaceRelated):
    created_at = models.DateTimeField(auto_now_add=True)
    data = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"Dump for {self.workspace} at {self.created_at}"

    def save(self, *args, **kwargs):
        all_data = {}

        # Get all models in the project
        for model in apps.get_models():
            # Check if the model is related to WorkspaceRelated and is not WorkspaceSnapshot or entity.entity
            if (
                issubclass(model, WorkspaceRelated)
                and model != WorkspaceSnapshot
                and not (
                    model._meta.app_label == "entity"
                    and model._meta.model_name == "entity"
                )
            ):
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


from django.db import models
from workspaces.models import WorkspaceRelated


class WorkspaceDiff(WorkspaceRelated):
    snapshot_before = models.ForeignKey(
        "WorkspaceSnapshot", on_delete=models.CASCADE, related_name="diffs_as_before"
    )
    snapshot_after = models.ForeignKey(
        "WorkspaceSnapshot", on_delete=models.CASCADE, related_name="diffs_as_after"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    diff_data = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"Diff for {self.workspace} from {self.snapshot_before.created_at} to {self.snapshot_after.created_at}"

    def save(self, *args, **kwargs):
        if not self.diff_data:
            self.diff_data = self.generate_diff()
        super().save(*args, **kwargs)

    def generate_diff(self):
        diff = {}
        before_data = self.snapshot_before.data
        after_data = self.snapshot_after.data

        for model_name in set(before_data.keys()) | set(after_data.keys()):
            model_diff = {"added": [], "modified": [], "deleted": []}

            before_objects = {obj["pk"]: obj for obj in before_data.get(model_name, [])}
            after_objects = {obj["pk"]: obj for obj in after_data.get(model_name, [])}

            for pk in set(before_objects.keys()) | set(after_objects.keys()):
                if pk not in before_objects:
                    model_diff["added"].append(after_objects[pk])
                elif pk not in after_objects:
                    model_diff["deleted"].append(before_objects[pk])
                elif before_objects[pk] != after_objects[pk]:
                    model_diff["modified"].append(
                        {"before": before_objects[pk], "after": after_objects[pk]}
                    )

            if any(model_diff.values()):
                diff[model_name] = model_diff

        return diff
