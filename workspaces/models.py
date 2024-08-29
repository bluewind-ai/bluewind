from django.utils import timezone
import uuid
from django.db import models
from django.contrib.admin import AdminSite, ModelAdmin
from django.contrib.auth import login as auth_login
from django.db import transaction
from django.contrib import admin, messages
from django.shortcuts import redirect
from django.urls import reverse
from django.conf import settings
from django.utils.html import format_html


# Assuming these are defined elsewhere
from base_model.models import BaseModel
from base_model_admin.models import BaseAdmin
from workspace_filter.models import User

def get_short_workspace_id(workspace_id):
    return str(workspace_id).replace('-', '')[-12:]

class Workspace(BaseModel):
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(default=timezone.now)
    users = models.ManyToManyField(User, through='WorkspaceUser')

    def __str__(self):
        return self.name

    def get_admin_url(self):
        short_id = get_short_workspace_id(self.id)
        return f'/wks_{short_id}/admin/'

    def admin_url_link(self):
        url = self.get_admin_url()
        return format_html('<a href="{}">{}</a>', url, url)
    admin_url_link.short_description = "Admin URL"

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
            
            if not workspace:
                # Create a new workspace if none exists
                workspace = Workspace.objects.create(name="Default Workspace")
                WorkspaceUser.objects.create(user=request.user, workspace=workspace, is_default=True)
                messages.success(request, "A new workspace has been created.")
            
            short_id = get_short_workspace_id(workspace.id)
            return redirect(f'/wks_{short_id}/admin/')
        
        return response

# Create an instance of the custom admin site
custom_admin_site = CustomAdminSite(name='customadmin')
class WorkspaceUserAdmin(ModelAdmin):
    def get_list_display(self, request):
        return [field.name for field in self.model._meta.fields]

class WorkspaceAdmin(BaseAdmin):
    list_display = ('name', 'short_id', 'created_at', 'admin_url_link')
    readonly_fields = ('admin_url_link',)

    def short_id(self, obj):
        return get_short_workspace_id(obj.id)
    short_id.short_description = 'ID'


# Register models with the custom admin site
custom_admin_site.register(WorkspaceUser, WorkspaceUserAdmin)
custom_admin_site.register(Workspace, WorkspaceAdmin)

# If you want to keep the default admin site as well, you can register models there too
admin.site.register(WorkspaceUser, WorkspaceUserAdmin)
admin.site.register(Workspace)