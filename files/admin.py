# Register your models here.


from base_model_admin.admin import InWorkspace


class FileAdmin(InWorkspace):
    list_display = ["path", "created_at", "updated_at"]
