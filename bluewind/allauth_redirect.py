from django.conf import settings
from django.shortcuts import redirect


class WksRedirectMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if "/wks_" in request.path and "/accounts/" in request.path:
            # Extract the part after 'wks_XXXXXXXXX/'
            new_path = "/".join(request.path.split("/")[2:])
            return redirect(f"{settings.SITE_URL}/{new_path}")
        return self.get_response(request)
