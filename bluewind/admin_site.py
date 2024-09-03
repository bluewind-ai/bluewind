import logging

from allauth.account.adapter import DefaultAccountAdapter

from django.contrib.admin import AdminSite
from django.shortcuts import redirect
from django.urls import path, reverse
from workspaces.models import Workspace, WorkspaceUser

logger = logging.getLogger(__name__)


class CustomAdminSite(AdminSite):
    def get_workspace_id(self, request):
        return request.META.get("WORKSPACE_ID") or next(
            (
                part[4:]
                for part in (
                    request.META.get("SCRIPT_NAME", "")
                    + request.META.get("PATH_INFO", "")
                ).split("/")
                if part.startswith("wks_")
            ),
            None,
        )

    def index(self, request, workspace_id=None, extra_context=None):
        extra_context = extra_context or {}
        extra_context["workspace_id"] = workspace_id
        app_list = self.get_app_list(request)
        for app in app_list:
            app["app_url"] = reverse(
                "admin:app_list",
                kwargs={"app_label": app["app_label"], "workspace_id": workspace_id},
                current_app=self.name,
            )
        extra_context["app_list"] = app_list
        return super().index(request, extra_context)

    def redirect_to_default_workspace(self, request):
        default_workspace = WorkspaceUser.objects.get_or_create(
            user=request.user,
            is_default=True,
            defaults={"workspace__name": f"{request.user.username}'s Workspace"},
        )[0].workspace
        return redirect(
            reverse("admin:index", kwargs={"workspace_id": default_workspace.id})
        )

    def each_context(self, request):
        context = super().each_context(request)
        workspace_id = self.get_workspace_id(request)
        if workspace_id:
            context["workspace_id"] = workspace_id
        return context

    def get_urls(self):
        urlpatterns = super().get_urls()
        custom_urlpatterns = [
            path(
                "wks_<int:workspace_id>/admin/<app_label>/",
                self.admin_view(self.app_index),
                name="app_list",
            ),
            path(
                "wks_<int:workspace_id>/admin/",
                self.admin_view(self.index),
                name="index",
            ),
        ]
        return custom_urlpatterns + urlpatterns

    def app_index(self, request, app_label, workspace_id=None, extra_context=None):
        extra_context = extra_context or {}
        extra_context["workspace_id"] = workspace_id
        return super().app_index(request, app_label, extra_context)


custom_admin_site = CustomAdminSite(name="customadmin")


class WorkspaceMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        workspace_id = next(
            (part[4:] for part in request.path.split("/") if part.startswith("wks_")),
            None,
        )
        if workspace_id:
            request.workspace_id = workspace_id
            logger.info(f"Workspace ID set: {workspace_id}")
        response = self.get_response(request)
        return response


from django.conf import settings


class WksRedirectMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if "/wks_" in request.path and "/accounts/" in request.path:
            # Extract the part after 'wks_XXXXXXXXX/'
            new_path = "/".join(request.path.split("/")[2:])
            return redirect(f"{settings.SITE_URL}/{new_path}")
        return self.get_response(request)


class CustomAccountAdapter(DefaultAccountAdapter):
    def get_login_redirect_url(self, request):
        workspace = Workspace.objects.first()
        if not workspace:
            workspace = Workspace.objects.create(name="Default Workspace")
            WorkspaceUser.objects.create(
                user=request.user, workspace=workspace, is_default=True
            )

        return f"/wks_{workspace.id}/admin/"
