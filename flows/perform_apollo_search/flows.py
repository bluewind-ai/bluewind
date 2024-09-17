import json
import logging
import os

import requests
from django.contrib import messages
from django.db import transaction

from bluewind.context_variables import get_workspace_id
from people.models import Person
from workspaces.models import Workspace

logger = logging.getLogger(__name__)


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
                            workspace=Workspace.objects.get(id=get_workspace_id()),
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
                    f"Attempted to create {
                        len(created_objects)} people. Actually created: {actual_created} (duplicates were ignored)",
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
