# from workspaces.models import Workspace, WorkspaceUser


# def create_superuser_workspace():
#     # check if the workspace already exists
#     workspace = Workspace.objects.filter(name="superuser").first()
#     if workspace:
#         return

#     workspace = Workspace.objects.create(name="superuser")

#     WorkspaceUser.objects.create(user_id=1, workspace_id=workspace.id, is_default=True)

#     return workspace
