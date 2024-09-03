import logging

from django.contrib.admin import AdminSite
from django.shortcuts import redirect
from django.urls import reverse

logger = logging.getLogger(__name__)


class CustomAdminSite(AdminSite):
    pass


custom_admin_site = CustomAdminSite(name="customadmin")


def admin_login_middleware(get_response):
    def middleware(request):
        if request.path.startswith("/admin/") and not request.user.is_authenticated:
            return redirect(reverse("account_login"))
        return get_response(request)

    return middleware
