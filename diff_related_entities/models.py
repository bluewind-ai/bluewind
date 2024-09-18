import json

from django.apps import apps
from django.core import serializers
from django.core.exceptions import ObjectDoesNotExist
from django.db import models

from workspaces.models import WorkspaceRelated


class DiffRelatedEntities(WorkspaceRelated):
    diff = models.OneToOneField(
        "workspace_diffs.WorkspaceDiff",
        on_delete=models.CASCADE,
        related_name="related_entities",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    data = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"Related entities for diff {self.diff.id} at {self.created_at}"

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
