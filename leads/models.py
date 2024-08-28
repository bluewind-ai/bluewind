from django.db import models

from base_model.models import BaseModel
from workspace_filter.models import User

class Lead(BaseModel):
    name = models.CharField(max_length=100)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    company_domain_name = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=[
        ('NEW', 'New'),
        ('CONTACTED', 'Contacted'),
        ('QUALIFIED', 'Qualified'),
        ('LOST', 'Lost'),
        ('CONVERTED', 'Converted'),
    ], default='NEW')
    source = models.CharField(max_length=50, blank=True)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_leads')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


def populate_test_email(modeladmin, request, queryset):
    queryset.update(email='test@test.com')
populate_test_email.short_description = "Set email to test@test.com"

from workspaces.models import custom_admin_site 
from django.contrib import admin

class LeadAdmin(admin.ModelAdmin):
    actions = [populate_test_email]



custom_admin_site.register(Lead, LeadAdmin)