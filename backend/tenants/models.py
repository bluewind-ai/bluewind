from django.db import models
from django_multitenant.models import TenantManager

class Tenant(models.Model):
    name = models.CharField(max_length=100)
    subdomain = models.CharField(max_length=100, unique=True)

    objects = TenantManager()

    def __str__(self):
        return self.name

class TenantAwareModel(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)

    objects = TenantManager()

    class Meta:
        abstract = True