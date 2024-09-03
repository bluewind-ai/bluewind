import admin_autoregister
from bluewind.admin_site import custom_admin_site
from channels.models import oauth2callback
from django.conf import settings
from django.conf.urls.static import static
from django.shortcuts import redirect
from django.urls import include, path, re_path
from django.views.decorators.csrf import csrf_exempt
from django.views.generic.base import RedirectView
from health_check.views import health_check
from webhook_tester.models import dummy_webhook

test = admin_autoregister
favicon_view = RedirectView.as_view(url="/static/favicon.ico", permanent=True)
admin_redirect = RedirectView.as_view(url="/admin/", permanent=False)


def wks_redirect(request, workspace_id, path):
    return redirect(f"/wks_{workspace_id}/admin/{path}")


urlpatterns = [
    # Workspace admin URLs
    re_path(r"^wks_(?P<workspace_id>\d+)/admin/", custom_admin_site.urls),
    # Redirect non-admin workspace URLs to the workspace admin
    re_path(r"^wks_(?P<workspace_id>\d+)/(?P<path>.*)$", wks_redirect),
    # Root admin URL (this will be handled by the CustomAdminSite.index method)
    path("admin/", custom_admin_site.urls),
    # Root redirect
    path("", admin_redirect, name="root_redirect"),
    # Existing patterns
    path("__debug__/", include("debug_toolbar.urls")),
    path("", include("user_sessions.urls", "user_sessions")),
    path("health/", health_check, name="health_check"),
    re_path(r"^favicon\.ico$", favicon_view),
    path("oauth2callback/", oauth2callback, name="oauth2callback"),
    path("accounts/", include("allauth.urls")),
    path(
        "admin/webhook_tester/webhooktest/dummy-webhook/",
        csrf_exempt(dummy_webhook),
        name="dummy_webhook",
    ),
    # New pattern for accounts redirects (moved to the end to avoid conflicts)
    re_path(
        r"^wks_[^/]+/(?P<path>accounts/.*)$",
        lambda request, path: redirect(f"{settings.SITE_URL}/{path}"),
    ),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
