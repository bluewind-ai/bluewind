from django.conf import settings
from django.conf.urls.static import static
from django.shortcuts import redirect
from django.urls import include, path, re_path
from django.views.generic.base import RedirectView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.routers import DefaultRouter

from bluewind.admin_site import custom_admin_site
from health_check.views import health_check

favicon_view = RedirectView.as_view(url="/static/favicon.ico", permanent=True)


def redirect_to_admin(request):
    return redirect("admin:index")


router = DefaultRouter()

urlpatterns = [
    # Redirect root to admin
    # path("", home, name="home"),
    path("", redirect_to_admin, name="home"),
    # Use custom_admin_site for /admin
    path("admin/", custom_admin_site.urls),
    # Existing paths
    path("__debug__/", include("debug_toolbar.urls")),
    path("health/", health_check, name="health_check"),
    re_path(r"^favicon\.ico$", favicon_view),
    # DRF and DRF Spectacular paths
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/schema/swagger-ui/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    # Function call view
    # path(
    #     "function_calls/<int:object_id>/",
    #     without_admin.function_call_change_view,
    #     name="function_call_change",
    # ),
]

urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
