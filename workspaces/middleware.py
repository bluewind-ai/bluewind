# from django.shortcuts import redirect
# from django.urls import resolve, reverse
# from workspaces.models import WorkspaceUser

# class WorkspaceAdminMiddleware:
#     # def __init__(self, get_response):
#     #     self.get_response = get_response

#     # def __call__(self, request):
#     #     if request.path.startswith('/admin/') and request.user.is_authenticated:
#     #         path_parts = request.path.split('/')
#     #         if len(path_parts) > 2 and not path_parts[2].startswith('workspaces'):
#     #             try:
#     #                 workspace_user = WorkspaceUser.objects.get(user=request.user, is_default=True)
#     #                 workspace_display_id = workspace_user.workspace.display_id
                    
#     #                 # Construct the new URL by inserting the workspace display ID after '/admin/'
#     #                 new_path = f"/admin/{workspace_display_id}/{'/'.join(path_parts[2:])}"
#     #                 return redirect(new_path + ('?' + request.GET.urlencode() if request.GET else ''))
#     #             except WorkspaceUser.DoesNotExist:
#     #                 # Handle the case where the user doesn't have a default workspace
#     #                 pass

#     #     response = self.get_response(request)
#     #     return response
    
#     def __init__(self, get_response):
#         self.get_response = get_response

#     def __call__(self, request):
#         if request.path.startswith('/admin/workspace/'):
#             parts = request.path.split('/')
#             if len(parts) > 4 and parts[3].isdigit():
#                 new_path = '/admin/' + '/'.join(parts[4:])
#                 request.path = new_path
#                 request.path_info = new_path
#         response = self.get_response(request)
#         return response