from asyncio.log import logger

from django.contrib import admin
from workspaces.models import Workspace


class InWorkspace(admin.ModelAdmin):
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        workspace_id = request.environ.get("WORKSPACE_ID")
        logger.debug(f"get_queryset: workspace_id = {workspace_id}")
        if self.model == Workspace:
            return qs.filter(id=workspace_id)
        return qs.filter(workspace_id=workspace_id).select_related("workspace")

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        workspace_id = request.environ.get("WORKSPACE_ID")
        logger.debug(f"formfield_for_foreignkey: workspace_id = {workspace_id}")

        if db_field.name == "workspace":
            logger.debug("Handling workspace field")
            try:
                workspace = Workspace.objects.get(id=workspace_id)
                logger.debug(f"Found workspace: {workspace}")
                kwargs["queryset"] = Workspace.objects.filter(id=workspace_id)
                kwargs["initial"] = workspace
            except Workspace.DoesNotExist:
                logger.error(f"No workspace found with id: {workspace_id}")
            except Exception as e:
                logger.exception(f"Error setting workspace: {str(e)}")
        elif hasattr(db_field.related_model, "workspace"):
            logger.debug(f"Handling related field: {db_field.name}")
            kwargs["queryset"] = db_field.related_model.objects.filter(
                workspace_id=workspace_id
            )

        return super().formfield_for_foreignkey(db_field, request, **kwargs)
