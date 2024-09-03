from asyncio.log import logger

from django.contrib import admin
from workspaces.models import Workspace


class InWorkspace(admin.ModelAdmin):
    def get_list_display(self, request):
        # By default, display all fields in the list view
        return [field.name for field in self.model._meta.fields]

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        workspace_public_id = request.environ.get("WORKSPACE_PUBLIC_ID")
        logger.debug(f"get_queryset: workspace_public_id = {workspace_public_id}")
        if self.model == Workspace:
            return qs.filter(public_id=workspace_public_id)
        return qs.filter(workspace__public_id=workspace_public_id)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        workspace_public_id = request.environ.get("WORKSPACE_PUBLIC_ID")
        logger.debug(
            f"formfield_for_foreignkey: workspace_public_id = {workspace_public_id}"
        )

        if db_field.name == "workspace":
            logger.debug("Handling workspace field")
            try:
                workspace = Workspace.objects.get(public_id=workspace_public_id)
                logger.debug(f"Found workspace: {workspace}")
                kwargs["queryset"] = Workspace.objects.filter(
                    public_id=workspace_public_id
                )
                kwargs["initial"] = workspace
            except Workspace.DoesNotExist:
                logger.error(
                    f"No workspace found with public_id: {workspace_public_id}"
                )
            except Exception as e:
                logger.exception(f"Error setting workspace: {str(e)}")
        elif hasattr(db_field.related_model, "workspace"):
            logger.debug(f"Handling related field: {db_field.name}")
            kwargs["queryset"] = db_field.related_model.objects.filter(
                workspace__public_id=workspace_public_id
            )

        return super().formfield_for_foreignkey(db_field, request, **kwargs)
