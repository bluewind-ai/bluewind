from django.http import HttpResponseRedirect
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

from base_model_admin.models import BaseAdmin
from bluewind.utils import uuid7
from public_id.models import public_id
from workspace_filter.models import User
# from base_model.models import BaseModel

class Workspace(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid7, editable=False)

    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(default=timezone.now)
    users = models.ManyToManyField(User, through='WorkspaceUser')

    @property
    def public_id(self):
        return public_id(self.__class__.__name__, self.id)
        
    def __str__(self):
        return self.name

    def get_admin_url(self):
        return f'/{self.public_id}/admin/'

    def admin_url_link(self):
        url = self.get_admin_url()
        return format_html('<a href="{}">{}</a>', url, url)
    admin_url_link.short_description = "Admin URL"

class WorkspaceUser(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid7, editable=False)
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
            
            return redirect(f'/{workspace.public_id}/admin/')
        
        return response
from django.apps import apps

def clone_workspace(workspace, request):
    with transaction.atomic():

        new_workspace = workspace.make_clone(
            attrs={'name': f"Clone of {workspace.name}"},
            # new_workspace_public_id=workspace.public_id
        )



        # Clone related objects
        for model in apps.get_models():
            if issubclass(model, BaseModel) and not model._meta.abstract:
                model.clone_workspace_related(workspace.public_id, new_workspace.public_id)

        return new_workspace  # Ensure only one workspace is returned


# Create an instance of the custom admin site
custom_admin_site = CustomAdminSite(name='customadmin')
class WorkspaceUserAdmin(ModelAdmin):
    @property
    def public_id(self):
        public_id(self.__class__.__name__, self.id)
        
    def get_list_display(self, request):
        return [field.name for field in self.model._meta.fields]


from django.urls import reverse

class WorkspaceAdmin(BaseAdmin):
    list_display = ('name', 'id', 'created_at')
    actions = ['clone_workspace_action']
    readonly_fields = ('admin_url_link',)


    def clone_workspace_action(self, request, queryset):
        if queryset.count() != 1:
            self.message_user(request, "Please select only one workspace to clone.", level=messages.WARNING)
            return

        workspace = queryset.first()
        new_workspace = clone_workspace(workspace, request)

        self.message_user(request, f"Workspace '{workspace.name}' has been cloned successfully.", level=messages.SUCCESS)

        # Redirect to the change page of the new workspace
        return HttpResponseRedirect(reverse('customadmin:workspaces_workspace_change', args=[new_workspace.id]))

    clone_workspace_action.short_description = "Clone selected workspace"


# Register models with the custom admin site
custom_admin_site.register(WorkspaceUser, WorkspaceUserAdmin)
custom_admin_site.register(Workspace, WorkspaceAdmin)

# If you want to keep the default admin site as well, you can register models there too
admin.site.register(WorkspaceUser, WorkspaceUserAdmin)
admin.site.register(Workspace)