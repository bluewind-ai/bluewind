from django.contrib import admin
from django.contrib import messages
from workspaces.models import WorkspaceUser

@admin.register(WorkspaceUser)
class WorkspaceUserAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        return [field.name for field in self.model._meta.fields]