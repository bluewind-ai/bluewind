import logging

from allauth.account.adapter import DefaultAccountAdapter

from django.contrib.admin import AdminSite
from django.shortcuts import redirect, reverse
from django.urls import reverse
from workspaces.models import Workspace, WorkspaceUser

logger = logging.getLogger(__name__)


class CustomAdminSite(AdminSite):
    def logout(self, request, extra_context=None):
        super().logout(request, extra_context)
        return redirect("account_logout")

    def index(self, request, extra_context=None):
        workspace_id = request.environ.get("WORKSPACE_ID")

        if not workspace_id:
            logger.debug("index: No workspace_id, redirecting to default workspace")
            return self.redirect_to_default_workspace(request)

        logger.debug(f"index: Rendering index for workspace {workspace_id}")
        # Call the superclass index method to render the actual admin index
        return super().index(request, extra_context)

    def redirect_to_default_workspace(self, request):
        workspace = Workspace.objects.filter(
            workspaceuser__user=request.user, workspaceuser__is_default=True
        ).first()

        if not workspace:
            workspace = Workspace.objects.create(name="Default Workspace")
            WorkspaceUser.objects.create(
                user=request.user, workspace=workspace, is_default=True
            )

        return redirect(f"/workspaces/{workspace.id}/admin/")


custom_admin_site = CustomAdminSite(name="customadmin")


def admin_login_middleware(get_response):
    def middleware(request):
        if request.path.startswith("/admin/") and not request.user.is_authenticated:
            return redirect(reverse("account_login"))
        return get_response(request)

    return middleware


class CustomAccountAdapter(DefaultAccountAdapter):
    def get_login_redirect_url(self, request):
        workspace = Workspace.objects.filter(
            workspaceuser__user=request.user, workspaceuser__is_default=True
        ).first()

        if not workspace:
            workspace = Workspace.objects.create(name="Default Workspace")
            WorkspaceUser.objects.create(
                user=request.user, workspace=workspace, is_default=True
            )

        return f"/workspaces/{workspace.id}/admin/"
