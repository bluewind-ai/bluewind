from django.apps import AppConfig


class FilesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "files"

    def ready(self):
        from flows.flows.files_on_ready import files_on_ready

        files_on_ready()
