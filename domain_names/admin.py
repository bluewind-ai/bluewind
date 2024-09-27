# Register your models here.

from base_model_admin.admin import InWorkspace


class DomainNameAdmin(InWorkspace):
    list_display = ("name", "workspace")
    search_fields = ("name",)
    list_filter = ("workspace",)
