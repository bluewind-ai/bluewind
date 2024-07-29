from django_multitenant.utils import set_current_tenant
from .models import Tenant

class TenantMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        hostname = request.get_host().split(':')[0].lower()
        subdomain = hostname.split('.')[0]
        try:
            tenant = Tenant.objects.get(subdomain=subdomain)
            set_current_tenant(tenant)
        except Tenant.DoesNotExist:
            pass
        response = self.get_response(request)
        return response