# file_watchers/apps.py

from django.apps import AppConfig


class FileWatchersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "file_watchers"

    def ready(self):
        from flows.flows.file_watchers_on_ready import file_watchers_on_ready

        file_watchers_on_ready()
