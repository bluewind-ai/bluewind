# Register your models here.


from base_admin.admin import InWorkspace


class FileAdmin(InWorkspace):
    list_display = ["path", "created_at", "updated_at"]
    search_fields = ["path"]
