from django.conf import settings
from django.conf.urls.static import static
from django.shortcuts import redirect
from django.urls import include, path, re_path
from django.views.generic.base import RedirectView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.routers import DefaultRouter

from bluewind.admin_site import custom_admin_site

# from channels.models import oauth2callback
from function_calls.views import admin_next_view
from health_check.views import health_check

favicon_view = RedirectView.as_view(url="/static/favicon.ico", permanent=True)


def redirect_to_admin(request):
    return redirect("admin:index")


# Create a router and register your viewsets
router = DefaultRouter()
# TODO: Register your viewsets here, for example:
# router.register(r'items', ItemViewSet)

urlpatterns = [
    # Redirect root to admin
    # Use custom_admin_site for /admin
    path("admin/", custom_admin_site.urls),
    # Existing paths
    path("__debug__/", include("debug_toolbar.urls")),
    path("health/", health_check, name="health_check"),
    re_path(r"^favicon\.ico$", favicon_view),
    # path("oauth2callback/", oauth2callback, name="oauth2callback"),
    # path("accounts/", include("allauth.urls")),
    # DRF and DRF Spectacular paths
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/schema/swagger-ui/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    # path("silk/", include("silk.urls", namespace="silk")),
    path("admin/next/", admin_next_view, name="admin_next"),
]

urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
