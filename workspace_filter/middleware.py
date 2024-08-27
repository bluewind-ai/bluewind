# modify_admin/middleware.py

from django.db.models import Q

class WorkspaceFilterMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        workspace_id = request.environ.get('WORKSPACE_ID')
        if workspace_id:
            # Apply the filter to all querysets
            from django.db.models.query import QuerySet
            original_filter = QuerySet.filter

            def custom_filter(self, *args, **kwargs):
                return original_filter(self, *args, **kwargs, workspace_id=workspace_id)

            QuerySet.filter = custom_filter

        response = self.get_response(request)

        # Restore original filter method
        if workspace_id:
            QuerySet.filter = original_filter

        return response