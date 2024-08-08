from django.contrib import admin
from django.template.defaulttags import url
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('homepage.urls')),  # This line includes your new homepage app
    path('__debug__/', include('debug_toolbar.urls')),
    path('', include('user_sessions.urls', 'user_sessions')),
]