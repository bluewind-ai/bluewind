from django.contrib import admin
from django.template.defaulttags import url
from django.urls import path, include, re_path
from django.views.generic.base import RedirectView
from django.conf import settings
from django.conf.urls.static import static

from health_check.views import health_check


favicon_view = RedirectView.as_view(url='/static/favicon.ico', permanent=True)
admin_redirect = RedirectView.as_view(url='/admin/', permanent=True)


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', admin_redirect, name='root_redirect'),  # This line redirects root to admin
    path('__debug__/', include('debug_toolbar.urls')),
    path('', include('user_sessions.urls', 'user_sessions')),
    path('health/', health_check, name='health_check'),
    re_path(r'^favicon\.ico$', favicon_view),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)