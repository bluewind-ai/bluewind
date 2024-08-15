from django.contrib import admin
from django.template.defaulttags import url
from django.urls import path, include, re_path
from .health_check import health_check  # Import the health_check view
from django.views.generic.base import RedirectView
from django.conf import settings
from django.conf.urls.static import static

favicon_view = RedirectView.as_view(url='/static/favicon.ico', permanent=True)


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('homepage.urls')),  # This line includes your new homepage app
    path('__debug__/', include('debug_toolbar.urls')),
    path('', include('user_sessions.urls', 'user_sessions')),
    path('health/', health_check, name='health_check'),
    re_path(r'^favicon\.ico$', favicon_view),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)