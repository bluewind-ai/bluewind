import json

from django.apps import apps
from django.core import serializers
from django.core.exceptions import ObjectDoesNotExist
from django.db import models

from workspaces.models import WorkspaceRelated


class WorkspaceSnapshot(WorkspaceRelated):
    created_at = models.DateTimeField(auto_now_add=True)
    data = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"Dump for {self.workspace} at {self.created_at} id {self.id}"

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
        return f"Diff for {self.workspace} id {self.workspace.id} from {self.snapshot_before.created_at} to {self.snapshot_after.created_at}"

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


from django.db import models

from workspaces.models import WorkspaceRelated


class DiffRelatedEntities(WorkspaceRelated):
    diff = models.OneToOneField(
        "WorkspaceDiff", on_delete=models.CASCADE, related_name="related_entities"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    data = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"Related entities for diff {self.diff.id} at {self.created_at}"

    def save(self, *args, **kwargs):
        if not self.data:
            self.data = self.generate_related_entities_snapshot()
        super().save(*args, **kwargs)

    def generate_related_entities_snapshot(self):
        all_data = {}
        related_objects = set()

        affected_objects = self.get_affected_objects()

        for obj in affected_objects:
            related_objects.add(obj)
            related_objects.update(self.get_related_objects(obj))

        for obj in related_objects:
            model = type(obj)
            if model.__name__ not in all_data:
                all_data[model.__name__] = []

            serialized_data = json.loads(serializers.serialize("json", [obj]))[0]
            all_data[model.__name__].append(serialized_data)

        return all_data

    def get_affected_objects(self):
        affected_objects = set()

        for model_name, diff_data in self.diff.diff_data.items():
            model = self.get_model_from_name(model_name)
            if not model:
                continue  # Skip if we can't find the model

            for category in ["added", "modified", "deleted"]:
                for item in diff_data.get(category, []):
                    if category == "modified":
                        pk = item["after"]["pk"]
                    else:
                        pk = item["pk"]
                    try:
                        obj = model.objects.get(pk=pk)
                        affected_objects.add(obj)
                    except model.DoesNotExist:
                        pass  # Object might have been deleted

        return affected_objects

    def get_model_from_name(self, model_name):
        for app_config in apps.get_app_configs():
            try:
                return app_config.get_model(model_name)
            except LookupError:
                continue
        return None

    def get_related_objects(self, obj):
        related_objects = set()

        for field in obj._meta.get_fields():
            if field.is_relation:
                try:
                    if field.many_to_one or field.one_to_one:
                        related_obj = getattr(obj, field.name)
                        if related_obj:
                            related_objects.add(related_obj)
                    elif field.many_to_many:
                        related_objs = getattr(obj, field.name).all()
                        related_objects.update(related_objs)
                except ObjectDoesNotExist:
                    # Handle the case where the related object doesn't exist
                    pass

        return related_objects
