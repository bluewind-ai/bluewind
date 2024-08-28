from django.db import models

class ApolloPeopleSearch(models.Model):
    SENIORITY_CHOICES = [
        ('senior', 'Senior'),
        ('manager', 'Manager'),
        # Add other seniority levels as needed
    ]

    EMAIL_STATUS_CHOICES = [
        ('verified', 'Verified'),
        ('guessed', 'Guessed'),
        ('unavailable', 'Unavailable'),
        ('bounced', 'Bounced'),
        ('pending_manual_fulfillment', 'Pending Manual Fulfillment'),
    ]

    PROSPECTED_CHOICES = [
        ('yes', 'Yes'),
        ('no', 'No'),
    ]

    person_titles = models.JSONField(blank=True, null=True, help_text="Array of person's titles")
    q_keywords = models.CharField(max_length=255, blank=True, help_text="Keywords to filter results")
    prospected_by_current_team = models.JSONField(blank=True, null=True, help_text="Array of 'yes' or 'no' strings")
    person_locations = models.JSONField(blank=True, null=True, help_text="Array of allowed person locations")
    person_seniorities = models.JSONField(blank=True, null=True, help_text="Array of seniority levels")
    contact_email_status = models.JSONField(blank=True, null=True, help_text="Array of email statuses")
    q_organization_domains = models.TextField(blank=True, help_text="Company domains separated by newline")
    organization_locations = models.JSONField(blank=True, null=True, help_text="Array of allowed organization locations")
    organization_ids = models.JSONField(blank=True, null=True, help_text="Array of organization IDs")
    organization_num_employees_ranges = models.JSONField(blank=True, null=True, help_text="Array of employee count ranges")
    page = models.PositiveIntegerField(default=1, help_text="Page number for pagination")
    per_page = models.PositiveIntegerField(default=10, help_text="Number of results per page (1-100)")

    def __str__(self):
        return f"Apollo People Search {self.id}"

    class Meta:
        verbose_name = "Apollo People Search"
        verbose_name_plural = "Apollo People Searches"

from django.contrib import admin
from workspaces.models import custom_admin_site

class ApolloPeopleSearchAdmin(admin.ModelAdmin):
    pass


custom_admin_site.register(ApolloPeopleSearch, ApolloPeopleSearchAdmin)