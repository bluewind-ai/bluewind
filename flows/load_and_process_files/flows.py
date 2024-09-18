import logging
import os

from django.db import transaction

from apps.models import App
from files.models import File
from flows.is_ignored_by_git.flows import is_ignored_by_git
from models.models import Model

logger = logging.getLogger("django.not_used")


def load_and_process_files(
    base_dir, installed_apps, default_user_id, default_workspace_id
):
    files_to_create = []
    files_to_update = []
    apps_to_create = {}
    models_created = []
    models_updated = []

    for app in installed_apps:
        app_path = os.path.join(base_dir, app.replace(".", os.path.sep))
        for root, dirs, files in os.walk(app_path):
            for file_name in files:
                if file_name.endswith(".py"):
                    file_path = os.path.join(root, file_name)
                    if not is_ignored_by_git(file_path):
                        with open(file_path, "r") as file:
                            content = file.read()

                        file_obj = File(
                            path=file_path,
                            content=content,
                            user_id=default_user_id,
                            workspace_id=default_workspace_id,
                        )
                        files_to_create.append(file_obj)

                        if file_name == "models.py":
                            app_name = os.path.basename(os.path.dirname(file_path))
                            if app_name not in apps_to_create:
                                apps_to_create[app_name] = App(
                                    plural_name=f"{app_name}",
                                    user_id=default_user_id,
                                    workspace_id=default_workspace_id,
                                )

    existing_files = File.objects.filter(path__in=[f.path for f in files_to_create])
    existing_paths = set(existing_files.values_list("path", flat=True))

    files_to_create = [f for f in files_to_create if f.path not in existing_paths]

    with transaction.atomic():
        created_files = File.objects.bulk_create(files_to_create)
        for existing_file in existing_files:
            for new_file in files_to_create:
                if existing_file.path == new_file.path:
                    existing_file.content = new_file.content
                    files_to_update.append(existing_file)
                    break
        File.objects.bulk_update(files_to_update, ["content"])

        App.objects.bulk_create(apps_to_create.values())

        for file_obj in created_files + list(existing_files):
            if file_obj.path.endswith("models.py"):
                app_name = os.path.basename(os.path.dirname(file_obj.path))
                app, _ = App.objects.get_or_create(
                    plural_name=f"{app_name}",
                    user_id=default_user_id,
                    workspace_id=default_workspace_id,
                    defaults={"plural_name": app_name},
                )

                model, created = Model.objects.get_or_create(
                    file=file_obj,
                    defaults={
                        "app": app,
                        "user_id": default_user_id,
                        "workspace_id": default_workspace_id,
                    },
                )

                if created:
                    models_created.append(model)
                else:
                    if model.app != app:
                        model.app = app
                        model.save()
                        models_updated.append(model)

    return (
        existing_files,
        created_files,
        files_to_update,
        list(apps_to_create.values()),
        models_created,
        models_updated,
    )
