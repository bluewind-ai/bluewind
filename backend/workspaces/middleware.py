from django.shortcuts import redirect
from django.urls import resolve, reverse
from workspaces.models import WorkspaceUser

class WorkspaceAdminMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith('/admin/') and request.user.is_authenticated:
            resolved = resolve(request.path)
            if 'workspace_display_id' not in resolved.kwargs:
                try:
                    workspace_user = WorkspaceUser.objects.get(user=request.user, is_default=True)
                    workspace_display_id = workspace_user.workspace.display_id
                    
                    # Construct the new URL with the workspace display ID
                    new_path = f"/admin/{workspace_display_id}{request.path[6:]}"
                    return redirect(new_path + ('?' + request.GET.urlencode() if request.GET else ''))
                except WorkspaceUser.DoesNotExist:
                    # Handle the case where the user doesn't have a default workspace
                    pass

        response = self.get_response(request)
        return response