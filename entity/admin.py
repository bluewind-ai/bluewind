from base_model_admin.admin import InWorkspace


# Register your models here.
class EntityAdmin(InWorkspace):
    def get_queryset(self, request):
        return super().get_queryset(request).select_related("workspace")
