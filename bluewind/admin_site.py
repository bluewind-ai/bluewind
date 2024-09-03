import logging

from django.contrib.admin import AdminSite
from django.shortcuts import redirect
from workspaces.models import Workspace, WorkspaceUser

logger = logging.getLogger(__name__)


class CustomAdminSite(AdminSite):
    def each_context(self, request):
        context = super().each_context(request)
        script_name = request.META.get("SCRIPT_NAME", "")
        if script_name.startswith("/wks_"):
            context["workspace_id"] = script_name.split("/")[1][4:]
        logger.debug(f"each_context: script_name={script_name}, context={context}")
        return context

    def index(self, request, extra_context=None):
        logger.debug(f"index: path={request.path}")
        workspace_id = self.get_workspace_id(request)
        if not workspace_id:
            logger.debug("index: No workspace_id, redirecting to default workspace")
            return self.redirect_to_default_workspace(request)

        logger.debug(f"index: Rendering index for workspace {workspace_id}")
        extra_context = extra_context or {}
        extra_context["workspace_id"] = workspace_id
        return super().index(request, extra_context)

    def app_index(self, request, app_label, extra_context=None):
        workspace_id = self.get_workspace_id(request)
        if not workspace_id:
            return self.redirect_to_default_workspace(request)

        extra_context = extra_context or {}
        extra_context["workspace_id"] = workspace_id
        return super().app_index(request, app_label, extra_context)

    def get_workspace_id(self, request):
        script_name = request.META.get("SCRIPT_NAME", "")
        if script_name.startswith("/wks_"):
            return script_name.split("/")[1][4:]
        return None

    def redirect_to_default_workspace(self, request):
        logger.debug("redirect_to_default_workspace: Starting")
        try:
            default_workspace = WorkspaceUser.objects.get(
                user=request.user, is_default=True
            ).workspace
            logger.debug(
                f"redirect_to_default_workspace: Found default workspace {default_workspace.id}"
            )
        except WorkspaceUser.DoesNotExist:
            logger.debug(
                "redirect_to_default_workspace: No default workspace, creating one"
            )
            default_workspace = Workspace.objects.create(
                name=f"{request.user.username}'s Workspace"
            )
            WorkspaceUser.objects.create(
                user=request.user, workspace=default_workspace, is_default=True
            )

        redirect_url = f"/wks_{default_workspace.id}/admin/"
        logger.debug(f"redirect_to_default_workspace: Redirecting to {redirect_url}")
        return redirect(redirect_url)

    def _build_app_dict(self, request, label=None):
        app_dict = super()._build_app_dict(request, label)
        workspace_id = self.get_workspace_id(request)

        for model_name, model_dict in app_dict.get(label, {}).get("models", {}).items():
            if "admin_url" in model_dict:
                model_dict["admin_url"] = (
                    f"/wks_{workspace_id}{model_dict['admin_url']}"
                )
            if "add_url" in model_dict:
                model_dict["add_url"] = f"/wks_{workspace_id}{model_dict['add_url']}"

        return app_dict


custom_admin_site = CustomAdminSite(name="customadmin")
