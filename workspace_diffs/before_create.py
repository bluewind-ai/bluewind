def workspace_diffs_before_create(instance):
    if not instance.diff_data:
        before_data = instance.snapshot_before.data
        after_data = instance.snapshot_after.data

        diff = {}
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

        instance.diff_data = diff
