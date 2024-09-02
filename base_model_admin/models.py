from django.contrib import admin
from workspaces.models import Workspace


class BaseAdmin(admin.ModelAdmin):
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        workspace_public_id = request.environ["WORKSPACE_PUBLIC_ID"]
        # return qs
        if self.model == Workspace:
            return qs.filter(public_id=workspace_public_id)

        return qs.filter(workspace__public_id=workspace_public_id)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        workspace_public_id = request.environ["WORKSPACE_PUBLIC_ID"]

        if db_field.name == "workspace":
            kwargs["queryset"] = Workspace.objects.filter(public_id=workspace_public_id)
        elif hasattr(db_field.related_model, "workspace"):
            kwargs["queryset"] = db_field.related_model.objects.filter(
                workspace__public_id=workspace_public_id
            )

        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def save_model(self, request, obj, form, change):
        if not hasattr(obj, "workspace") or not obj.workspace:
            workspace = Workspace.objects.get(
                public_id=request.environ["WORKSPACE_PUBLIC_ID"]
            )
            obj.workspace = workspace
        super().save_model(request, obj, form, change)
