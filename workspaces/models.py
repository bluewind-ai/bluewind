from django.utils import timezone
import uuid
from django.db import models
from django.contrib.admin import AdminSite, ModelAdmin
from django.contrib.auth import login as auth_login
from django.db import transaction
from django.contrib import admin, messages
from django.shortcuts import redirect
from django.urls import reverse

# Assuming these are defined elsewhere
from base_model.models import BaseModel
from workspace_filter.models import User

def get_short_workspace_id(workspace_id):
    return str(workspace_id).replace('-', '')[-12:]

class Workspace(BaseModel):
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(default=timezone.now)
    users = models.ManyToManyField(User, through='WorkspaceUser')

    def __str__(self):
        return f"Workspace object ({self.id.int})"

class WorkspaceUser(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE)
    is_default = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'workspace')

from django.shortcuts import redirect
from django.urls import reverse
from django.contrib.admin import AdminSite

class CustomAdminSite(AdminSite):
    def each_context(self, request):
        context = super().each_context(request)
        script_name = request.META.get('SCRIPT_NAME', '')
        if script_name.startswith('/wks_'):
            context['workspace_id'] = script_name.split('/')[1][4:]  # Remove 'wks_' prefix
        return context

    def login(self, request, extra_context=None):
        response = super().login(request, extra_context)
        
        if request.method == 'POST' and request.user.is_authenticated:
            workspace = Workspace.objects.first()
            
            if workspace:
                short_id = get_short_workspace_id(workspace.id)
                return redirect(f'/wks_{short_id}/admin/')
            else:
                messages.error(request, "No workspace available.")
        
        return response

# Create an instance of the custom admin site
custom_admin_site = CustomAdminSite(name='customadmin')
class WorkspaceUserAdmin(ModelAdmin):
    def get_list_display(self, request):
        return [field.name for field in self.model._meta.fields]

# Register models with the custom admin site
custom_admin_site.register(WorkspaceUser, WorkspaceUserAdmin)
custom_admin_site.register(Workspace)

# If you want to keep the default admin site as well, you can register models there too
admin.site.register(WorkspaceUser, WorkspaceUserAdmin)
admin.site.register(Workspace)