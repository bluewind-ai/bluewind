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
        response = super().login(request, extra_context)

        if request.method == "POST" and request.user.is_authenticated:
            workspace = Workspace.objects.first()

            if not workspace:
                # Create a new workspace if none exists
                workspace = Workspace.objects.create(name="Default Workspace")
                WorkspaceUser.objects.create(
                    user=request.user, workspace=workspace, is_default=True
                )
                messages.success(request, "A new workspace has been created.")

            return redirect(f"/{workspace.public_id}/admin/")

        return response


custom_admin_site = CustomAdminSite(name="customadmin")
