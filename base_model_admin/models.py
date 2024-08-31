from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from workspaces.models import Workspace

class BaseAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        """
        Override get_list_display to always include the link as the first column
        """
        list_display = super().get_list_display(request)
        if 'link_to_object' not in list_display:
            return ('link_to_object',) + tuple(list_display)
        return list_display

    def link_to_object(self, obj):
        """
        Generate a link to the object's change page
        """
        url = reverse(
            f'admin:{obj._meta.app_label}_{obj._meta.model_name}_change',
            args=[obj.public_id],
        )
        return format_html('<a href="{}">{}</a>', url, str(obj))
    link_to_object.short_description = 'Object'

    def get_object(self, request, object_id, from_field=None):
        queryset = self.get_queryset(request)
        model = queryset.model
        
        try:
            # Try to get the object by public_id first
            return queryset.get(public_id=object_id)
        except (model.DoesNotExist, ValidationError):
            # If that fails, try to get by primary key (for backwards compatibility)
            try:
                return queryset.get(pk=object_id)
            except (model.DoesNotExist, ValidationError):
                return None

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        workspace_public_id = request.environ['WORKSPACE_PUBLIC_ID']
        
        if self.model == Workspace:
            return qs.filter(public_id=workspace_public_id)
        
        return qs.filter(workspace__public_id=workspace_public_id)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        workspace_public_id = request.environ['WORKSPACE_PUBLIC_ID']
        
        if db_field.name == "workspace":
            kwargs["queryset"] = Workspace.objects.filter(public_id=workspace_public_id)
        elif hasattr(db_field.related_model, 'workspace'):
            kwargs["queryset"] = db_field.related_model.objects.filter(
                workspace__public_id=workspace_public_id
            )
        
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def save_model(self, request, obj, form, change):
        if not hasattr(obj, 'workspace') or not obj.workspace:
            workspace = Workspace.objects.get(public_id=request.environ['WORKSPACE_PUBLIC_ID'])
            obj.workspace = workspace
        super().save_model(request, obj, form, change)