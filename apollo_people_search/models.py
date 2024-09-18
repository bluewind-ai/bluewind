from django.db import models

from apollo_people_search.after_create import apollo_people_search_after_create
from apollo_people_search.after_update import apollo_people_search_after_update
from apollo_people_search.before_create import apollo_people_search_before_create
from apollo_people_search.before_update import apollo_people_search_before_update
from workspaces.models import WorkspaceRelated


class ApolloPeopleSearch(WorkspaceRelated):
    SENIORITY_CHOICES = [
        ("senior", "Senior"),
        ("manager", "Manager"),
    ]

    EMAIL_STATUS_CHOICES = [
        ("verified", "Verified"),
        ("guessed", "Guessed"),
        ("unavailable", "Unavailable"),
        ("bounced", "Bounced"),
        ("pending_manual_fulfillment", "Pending Manual Fulfillment"),
    ]

    PROSPECTED_CHOICES = [
        ("yes", "Yes"),
        ("no", "No"),
    ]
    name = models.CharField(max_length=255)
    person_titles = models.JSONField(
        blank=True, null=True, help_text="Array of person's titles"
    )
    q_keywords = models.CharField(
        max_length=255, blank=True, help_text="Keywords to filter results"
    )
    prospected_by_current_team = models.JSONField(
        blank=True, null=True, help_text="Array of 'yes' or 'no' strings"
    )
    person_locations = models.JSONField(
        blank=True, null=True, help_text="Array of allowed person locations"
    )
    person_seniorities = models.JSONField(
        blank=True, null=True, help_text="Array of seniority levels"
    )
    contact_email_status = models.JSONField(
        blank=True, null=True, help_text="Array of email statuses"
    )
    q_organization_domains = models.TextField(
        blank=True, help_text="Company domains separated by newline"
    )
    organization_locations = models.JSONField(
        blank=True, null=True, help_text="Array of allowed organization locations"
    )
    organization_ids = models.JSONField(
        blank=True, null=True, help_text="Array of organization IDs"
    )
    organization_num_employees_ranges = models.JSONField(
        blank=True, null=True, help_text="Array of employee count ranges"
    )
    page = models.PositiveIntegerField(
        default=1, help_text="Page number for pagination"
    )
    per_page = models.PositiveIntegerField(
        default=10, help_text="Number of results per page (1-100)"
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Apollo People Search"
        verbose_name_plural = "Apollo People Searches"
        unique_together = ["name", "workspace"]

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        if is_new:
            apollo_people_search_before_create(self)
        else:
            apollo_people_search_before_update(self)
        super().save(*args, **kwargs)
        if is_new:
            apollo_people_search_after_create(self)
        else:
            apollo_people_search_after_update(self)
