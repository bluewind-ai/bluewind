# Register your models here.


from base_model_admin.admin import InWorkspace


# @admin.register(File, site=custom_admin_site)
class FileAdmin(InWorkspace):
    list_display = ["path", "created_at", "updated_at"]
    search_fields = ["path"]
