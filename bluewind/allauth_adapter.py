from allauth.account.adapter import DefaultAccountAdapter
from workspaces.models import Workspace, WorkspaceUser


class CustomAccountAdapter(DefaultAccountAdapter):
    def get_login_redirect_url(self, request):
        workspace = Workspace.objects.first()
        if not workspace:
            workspace = Workspace.objects.create(name="Default Workspace")
            WorkspaceUser.objects.create(
                user=request.user, workspace=workspace, is_default=True
            )

        return f"/{workspace.public_id}/admin/"
