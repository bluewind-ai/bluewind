from bluewind.admin_site import custom_admin_site
from channels.models import oauth2callback
from django.conf import settings
from django.conf.urls.static import static
from django.shortcuts import redirect
from django.urls import include, path, re_path
from django.views.generic.base import RedirectView
from health_check.views import health_check

favicon_view = RedirectView.as_view(url="/static/favicon.ico", permanent=True)


def redirect_to_admin(request):
    return redirect("admin:index")


urlpatterns = [
    # Redirect root to admin
    path("", redirect_to_admin, name="root_redirect"),
    # Use custom_admin_site for /admin
    path("admin/", custom_admin_site.urls),
    # Existing paths
    path("__debug__/", include("debug_toolbar.urls")),
    path("health/", health_check, name="health_check"),
    re_path(r"^favicon\.ico$", favicon_view),
    path("oauth2callback/", oauth2callback, name="oauth2callback"),
    path("accounts/", include("allauth.urls")),
]

urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
