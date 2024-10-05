# Create your models here.
from django.contrib.postgres.fields import ArrayField
from django.db import models

from workspaces.models import WorkspaceRelated


class ApolloCompanySearch(WorkspaceRelated):
    organization_ids = ArrayField(
        models.CharField(max_length=255),
        blank=True,
        null=True,
        help_text="An array of organization ids obtained from companies-search",
    )

    organization_num_employees_ranges = ArrayField(
        models.CharField(max_length=20),
        blank=True,
        null=True,
        help_text="An array of intervals to include organizations having number of employees in a range",
    )

    organization_locations = ArrayField(
        models.CharField(max_length=255),
        blank=True,
        null=True,
        help_text="An array of strings denoting allowed locations of organization headquarters",
    )

    organization_not_locations = ArrayField(
        models.CharField(max_length=255),
        blank=True,
        null=True,
        help_text="An array of strings denoting un-allowed locations of organization headquarters",
    )

    q_organization_keyword_tags = ArrayField(
        models.CharField(max_length=255),
        blank=True,
        null=True,
        help_text="An array of strings denoting the keywords an organization should be associated with",
    )

    prospected_by_current_team = ArrayField(
        models.CharField(max_length=3),
        blank=True,
        null=True,
        help_text="An array of string booleans defining whether we want models prospected by current team or not",
    )

    q_organization_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="A string representing the name of the organization we want to filter",
    )

    page = models.PositiveIntegerField(
        default=1,
        help_text="An integer that allows you to paginate through the results",
    )

    per_page = models.PositiveIntegerField(
        default=10,
        help_text="An integer to load per_page results on a page. Should be in inclusive range [1, 100]",
    )

    def __str__(self):
        return f"ApolloCompanySearch {self.id}"

    class Meta:
        verbose_name = "Apollo Company Search"
        verbose_name_plural = "Apollo Company Searches"
