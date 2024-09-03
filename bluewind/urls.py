from bluewind.admin_site import custom_admin_site
from channels.models import oauth2callback
from django.conf import settings
from django.conf.urls.static import static
from django.shortcuts import redirect
from django.urls import include, path, re_path
from django.views.generic.base import RedirectView
from health_check.views import health_check

favicon_view = RedirectView.as_view(url="/static/favicon.ico", permanent=True)

urlpatterns = [
    # Workspace admin URLs
    re_path(r"^wks_(?P<workspace_id>\d+)/admin/", custom_admin_site.urls),
    # Root admin URL
    path("admin/", custom_admin_site.urls),
    # Root redirect
    path("", lambda request: redirect("/admin/"), name="root_redirect"),
    # Requested paths
    path("__debug__/", include("debug_toolbar.urls")),
    path("health/", health_check, name="health_check"),
    re_path(r"^favicon\.ico$", favicon_view),
    path("oauth2callback/", oauth2callback, name="oauth2callback"),
    path("accounts/", include("allauth.urls")),
]

urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
