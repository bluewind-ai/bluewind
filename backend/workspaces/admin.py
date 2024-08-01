
from django.contrib.admin import AdminSite
from django.urls import reverse

class WorkspaceAdminSite(AdminSite):
    def each_context(self, request):
        context = super().each_context(request)
        if request.path.startswith('/admin/workspace/'):
            parts = request.path.split('/')
            if len(parts) > 4 and parts[3].isdigit():
                context['workspace_path'] = f'/admin/workspace/{parts[3]}/'
        return context

    def get_app_list(self, request, app_label=None):
        app_list = super().get_app_list(request, app_label)
        workspace_path = request.get_full_path().split('/admin/', 1)[0] + '/admin/'
        for app in app_list:
            app['app_url'] = workspace_path + app['app_url'].lstrip('/')
            for model in app['models']:
                model['admin_url'] = workspace_path + model['admin_url'].lstrip('/')
                if model.get('add_url'):
                    model['add_url'] = workspace_path + model['add_url'].lstrip('/')
        return app_list