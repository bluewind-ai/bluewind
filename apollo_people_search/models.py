import json
import os

import requests

from base_model_admin.admin import InWorkspace
from bluewind import logger
from django.contrib import messages
from django.db import models, transaction
from people.models import Person
from workspaces.models import Workspace, WorkspaceRelated


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


class ApolloPeopleSearchAdmin(InWorkspace):
    actions = ["perform_apollo_search"]

    def perform_apollo_search(self, request, queryset):
        for search in queryset:
            logger.info(f"Starting Apollo search for: {search}")

            # Prepare the payload
            payload = {
                "q_organization_domains": search.q_organization_domains,
                "page": search.page,
                "per_page": search.per_page,
                "organization_locations": search.organization_locations,
                "person_seniorities": search.person_seniorities,
                "organization_num_employees_ranges": search.organization_num_employees_ranges,
                "person_titles": search.person_titles,
            }

            # Remove None values
            payload = {k: v for k, v in payload.items() if v is not None}
            logger.debug(f"API payload: {payload}")

            # Perform the API request
            headers = {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache",
                "X-Api-Key": os.environ["APOLLO_API_KEY"],
            }

            try:
                response = requests.post(
                    "https://api.apollo.io/v1/mixed_people/search",
                    headers=headers,
                    data=json.dumps(payload),
                )
                response.raise_for_status()

                # Process the response
                data = response.json()
                logger.info(
                    f"Received {len(data.get('people', []))} people from Apollo API"
                )

                if data["people"] and len(data["people"]) > 0:
                    people_to_create = []
                    for person in data["people"]:
                        people_to_create.append(
                            Person(
                                first_name=person.get("first_name", ""),
                                last_name=person.get("last_name", ""),
                                linkedin_url=person.get("linkedin_url"),
                                workspace=Workspace.objects.get(
                                    id=request.environ["WORKSPACE_ID"]
                                ),
                                company_domain_name=person.get("organization", {}).get(
                                    "primary_domain", ""
                                ),
                                company_linkedin_url=person.get("organization", {}).get(
                                    "linkedin_url", ""
                                ),
                                email="",  # Set a default empty string for email
                            )
                        )

                    logger.info(f"Attempting to create {len(people_to_create)} people")

                    # Count existing people before bulk_create
                    existing_count = Person.objects.count()
                    logger.info(f"Existing people count: {existing_count}")

                    # Use bulk_create with ignore_conflicts=True
                    with transaction.atomic():
                        created_objects = Person.objects.bulk_create(
                            people_to_create, ignore_conflicts=True
                        )

                    # Count people after bulk_create
                    new_count = Person.objects.count()
                    actual_created = new_count - existing_count
                    logger.info(f"New people count: {new_count}")
                    logger.info(f"Actually created: {actual_created}")

                    self.message_user(
                        request,
                        f"Attempted to create {len(created_objects)} people. Actually created: {actual_created} (duplicates were ignored)",
                        messages.SUCCESS,
                    )
                else:
                    logger.warning("No results found in Apollo search")
                    self.message_user(
                        request, "No results found in Apollo search", messages.WARNING
                    )

            except requests.RequestException as e:
                logger.error(f"Error performing Apollo search for {search}: {str(e)}")
                self.message_user(
                    request,
                    f"Error performing Apollo search for {search}: {str(e)}",
                    messages.ERROR,
                )

    perform_apollo_search.short_description = (
        "Perform Apollo search for selected searches"
    )
