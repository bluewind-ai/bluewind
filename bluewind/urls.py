from channels.models import oauth2callback
from django.conf import settings
from django.conf.urls.static import static
from django.shortcuts import redirect
from django.urls import include, path, re_path
from django.views.generic.base import RedirectView
from health_check.views import health_check
from workspaces.models import custom_admin_site  # Import your custom admin site

favicon_view = RedirectView.as_view(url="/static/favicon.ico", permanent=True)
admin_redirect = RedirectView.as_view(url="/admin/", permanent=True)


def wks_redirect(request, path):
    return redirect(f"{settings.SITE_URL}/{path}")


urlpatterns = [
    # New pattern for wks_ redirects
    re_path(r"^wks_[^/]+/(?P<path>accounts/.*)$", wks_redirect),
    path(
        "admin/", custom_admin_site.urls
    ),  # Use custom_admin_site instead of admin.site
    path("", admin_redirect, name="root_redirect"),  # This line redirects root to admin
    path("__debug__/", include("debug_toolbar.urls")),
    path("", include("user_sessions.urls", "user_sessions")),
    path("health/", health_check, name="health_check"),
    re_path(r"^favicon\.ico$", favicon_view),
    path("oauth2callback/", oauth2callback, name="oauth2callback"),
    path("accounts/", include("allauth.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
