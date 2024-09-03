from django.contrib import messages
from django.contrib.admin import AdminSite
from django.shortcuts import redirect
from django.urls import reverse
from workspaces.models import Workspace, WorkspaceUser


class CustomAdminSite(AdminSite):
    def each_context(self, request):
        context = super().each_context(request)
        script_name = request.META.get("SCRIPT_NAME", "")
        if script_name.startswith("/wks_"):
            context["workspace_id"] = script_name.split("/")[1][
                4:
            ]  # Remove 'wks_' prefix
        return context

    def login(self, request, extra_context=None):
        if not request.user.is_authenticated:
            return redirect(reverse("account_login"))

        # If we're already in a workspace admin, just render the login page
        if request.path.startswith("/wks_"):
            return super().login(request, extra_context)

        # After successful login, redirect to default workspace
        if request.method == "POST" and request.user.is_authenticated:
            return self.redirect_to_default_workspace(request)

        return super().login(request, extra_context)

    def redirect_to_default_workspace(self, request):
        try:
            default_workspace = WorkspaceUser.objects.get(
                user=request.user, is_default=True
            ).workspace
        except WorkspaceUser.DoesNotExist:
            # If no default workspace, create one
            default_workspace = Workspace.objects.create(
                name=f"{request.user.username}'s Workspace"
            )
            WorkspaceUser.objects.create(
                user=request.user, workspace=default_workspace, is_default=True
            )
            messages.success(
                request, "A new default workspace has been created for you."
            )

        return redirect(f"/wks_{default_workspace.id}/admin/")

    def index(self, request, extra_context=None):
        # Check if we're at the root admin URL and not already in a workspace
        if request.path == reverse("admin:index") and not request.path.startswith(
            "/wks_"
        ):
            return self.redirect_to_default_workspace(request)

        # If we're already in a workspace admin, just render the index page
        return super().index(request, extra_context)


custom_admin_site = CustomAdminSite(name="customadmin")
