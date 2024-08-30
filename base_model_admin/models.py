from django.contrib import admin

from workspaces.models import Workspace



class BaseAdmin(admin.ModelAdmin):
    from workspaces.models import Workspace

    
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'workspace_public_id' in form.base_fields:
            form.base_fields['workspace_public_id'].initial = request.environ['WORKSPACE_PUBLIC_ID']
        return form
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        workspace_public_id = request.environ['WORKSPACE_PUBLIC_ID']
        
        # If the model being queried is Workspace, filter by public_id
        if self.model == Workspace:
            return qs.filter(public_id=workspace_public_id)
        
        # For all other models, filter by the workspace relationship
        return qs.filter(workspace__id=Workspace.objects.get(public_id=workspace_public_id).id)
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "channel":  # Adjust field name as necessary
            workspace_public_id = request.environ['WORKSPACE_PUBLIC_ID']
            kwargs["queryset"] = db_field.related_model.objects.filter(
                workspace_public_id=workspace_public_id
            )
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def save_model(self, request, obj, form, change):
        # if not obj.workspace_public_id:
        #     # intentionally not using get.
        # obj.workspace_public_id = request.environ['WORKSPACE_PUBLIC_ID']
        super().save_model(request, obj, form, change)
