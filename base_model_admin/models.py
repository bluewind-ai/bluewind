from django.contrib import admin

class BaseAdmin(admin.ModelAdmin):
    
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'workspace_public_id' in form.base_fields:
            form.base_fields['workspace_public_id'].initial = request.environ['WORKSPACE_PUBLIC_ID']
        return form
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # intentionally not using get.
        workspace_public_id = request.environ['WORKSPACE_PUBLIC_ID']
        # return qs
        return qs.filter(workspace_public_id=workspace_public_id)
    

    def save_model(self, request, obj, form, change):
        if not obj.workspace_public_id:
            # intentionally not using get.
            obj.workspace_public_id = request.environ['WORKSPACE_PUBLIC_ID']
        super().save_model(request, obj, form, change)
