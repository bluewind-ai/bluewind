import json
import os
from django.db import models
import requests

from django.contrib import messages

from leads.models import Lead

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
    actions = ['perform_apollo_search']

    def perform_apollo_search(self, request, queryset):
        for search in queryset:
            # Prepare the payload
            payload = {
                'q_organization_domains': search.q_organization_domains,
                'page': search.page,
                'per_page': search.per_page,
                'organization_locations': search.organization_locations,
                'person_seniorities': search.person_seniorities,
                'organization_num_employees_ranges': search.organization_num_employees_ranges,
                'person_titles': search.person_titles,
            }

            # Remove None values
            payload = {k: v for k, v in payload.items() if v is not None}

            # Perform the API request
            headers = {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                'X-Api-Key': os.environ["APOLLO_API_KEY"]
            }

            try:
                response = requests.post(
                    'https://api.apollo.io/v1/mixed_people/search',
                    headers=headers,
                    data=json.dumps(payload)
                )
                response.raise_for_status()
                
                # Process the response
                data = response.json()
                
                if data['people'] and len(data['people']) > 0:
                    person = data['people'][0]
                    lead = Lead.objects.create(
                        first_name=person['first_name'],
                        last_name=person['last_name'],
                        linkedin_url=person['linkedin_url'],
                        workspace_public_id=request.environ['WORKSPACE_PUBLIC_ID'],
                        company_domain_name=person['organization']['primary_domain'] if person['organization'] else '',
                        company_linkedin_url=person['organization']['linkedin_url'] if person['organization'] else '',

                    )
                    self.message_user(request, f"Created new lead: {lead}", messages.SUCCESS)
                else:
                    self.message_user(request, "No results found in Apollo search", messages.WARNING)
            
            except requests.RequestException as e:
                self.message_user(request, f"Error performing Apollo search for {search}: {str(e)}", messages.ERROR)

    perform_apollo_search.short_description = "Perform Apollo search for selected searches"



custom_admin_site.register(ApolloPeopleSearch, ApolloPeopleSearchAdmin)