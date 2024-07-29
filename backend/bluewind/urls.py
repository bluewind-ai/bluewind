from django.contrib import admin
from django.urls import include, path
from bluewind import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('allauth.urls')),
]