import logging
from django.contrib.auth import views as auth_views
from django.urls import reverse
from django.shortcuts import redirect
from django.core.exceptions import ObjectDoesNotExist
from workspaces.models import WorkspaceUser  # Adjust the import path as needed

logger = logging.getLogger(__name__)

class CustomLoginView(auth_views.LoginView):
    template_name = 'admin/login.html'  # Using admin login template

    def get_success_url(self):
        logger.info(f"Login successful for user {self.request.user.username}")
        if self.request.user.is_staff or self.request.user.is_superuser:
            try:
                default_workspace_user = WorkspaceUser.objects.get(
                    user=self.request.user,
                    is_default=True
                )
                default_workspace = default_workspace_user.workspace
                logger.info(f"Redirecting to workspace {default_workspace.display_id}")
                return f'/admin/workspaces/{default_workspace.display_id}/'
            except WorkspaceUser.DoesNotExist:
                logger.warning(f"No default workspace found for user {self.request.user.username}")
            except Exception as e:
                logger.error(f"Error getting default workspace for user {self.request.user.username}: {str(e)}")
            
            # Fallback to workspace list if no default workspace or error occurs
            logger.info("Redirecting to admin workspace list")
            return reverse('admin:workspaces_workspace_changelist')
        
        next_url = self.request.GET.get('next')
        if next_url:
            logger.info(f"Redirecting to next URL: {next_url}")
            return next_url
        
        logger.info("Redirecting to home")
        return '/'  # or any default URL for regular users

    def form_valid(self, form):
        logger.info("Login form is valid")
        response = super().form_valid(form)
        logger.info(f"Redirecting to {response.url}")
        return response