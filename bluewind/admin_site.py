import logging

from django.contrib.admin import AdminSite
from django.shortcuts import redirect, reverse
from django.urls import reverse
from workspaces.models import Workspace, WorkspaceUser

logger = logging.getLogger(__name__)


class CustomAdminSite(AdminSite):
    def logout(self, request, extra_context=None):
        super().logout(request, extra_context)
        return redirect("account_logout")

    def each_context(self, request):
        context = super().each_context(request)
        workspace_id = request.environ.get("WORKSPACE_ID")

        if not workspace_id:
            logger.debug(
                "each_context: No workspace_id, redirecting to default workspace"
            )
            workspace = Workspace.objects.filter(
                workspaceuser__user=request.user, workspaceuser__is_default=True
            ).first()

            if not workspace:
                workspace = Workspace.objects.create(name="Default Workspace")
                WorkspaceUser.objects.create(
                    user=request.user, workspace=workspace, is_default=True
                )

            redirect_url = f"/workspaces/{workspace.id}{request.path}"
            context["redirect_url"] = redirect_url
        else:
            logger.debug(f"each_context: Using workspace {workspace_id}")

        return context

    def admin_view(self, view, cacheable=False):
        def inner(request, *args, **kwargs):
            context = self.each_context(request)
            if "redirect_url" in context:
                return redirect(context["redirect_url"])
            return view(request, *args, **kwargs)

        return super().admin_view(inner, cacheable)


custom_admin_site = CustomAdminSite(name="customadmin")


def admin_login_middleware(get_response):
    def middleware(request):
        if request.path.startswith("/admin/") and not request.user.is_authenticated:
            return redirect(reverse("account_login"))
        return get_response(request)

    return middleware
