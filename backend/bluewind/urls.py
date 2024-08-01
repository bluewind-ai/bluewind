from django.contrib import admin
from django.urls import include, path
from auth.views import CustomLoginView

admin.site.login = CustomLoginView.as_view()

urlpatterns = [
    path('admin/', admin.site.urls),
    path('login/', CustomLoginView.as_view(), name='login'),
    path('', CustomLoginView.as_view(), name='root'),
    path('__debug__/', include('debug_toolbar.urls')),
]