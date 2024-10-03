from django.shortcuts import render


# Create your views here.
def home(request):
    "cdscdscds"
    return render(request, "core/home.html")


from django.conf import settings
from django.views.static import serve


def favicon_view(request):
    return serve(request, "favicon.ico", document_root=settings.STATIC_ROOT)
