from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('homepage.urls')),  # This line includes your new homepage app
    path('__debug__/', include('debug_toolbar.urls')),
]