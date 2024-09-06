import logging
import os

import requests

from django.db import models
from users.models import User
from workspaces.models import WorkspaceRelated

logger = logging.getLogger(__name__)


class Person(WorkspaceRelated):
    first_name = models.CharField(max_length=10, blank=True)
    last_name = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(blank=True)
    linkedin_url = models.URLField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True)
    company_domain_name = models.CharField(max_length=100, blank=True)
    company_linkedin_url = models.URLField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ("NEW", "New"),
            ("CONTACTED", "Contacted"),
            ("QUALIFIED", "Qualified"),
            ("LOST", "Lost"),
            ("CONVERTED", "Converted"),
        ],
        default="NEW",
    )
    source = models.CharField(max_length=50, blank=True)
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_people",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ["email", "workspace"]

    def __str__(self):
        if self.email:
            return f"{self.email}"
        return f"{self.first_name} {self.last_name}"

    def do_stuff(self):
        # Generate random data for all fields
        self.first_name = "Steph"
        self.last_name = "Silva"
        self.linkedin_url = "https://www.linkedin.com/in/steph-silva/"
        self.company_domain_name = "goingup.xyz"
        self.company_linkedin_url = "https://www.linkedin.com/company/goinguptech/"

        # Assuming you have a User model, you might want to assign a random user
        # If not, you can comment out or remove this line
        # self.assigned_to = User.objects.order_by('?').first()

        self.save()
        return f"Populated random data for {self.email}"

    def enrich_email(self):
        print(f"LEADMAGIC_API_KEY: {os.environ.get('LEADMAGIC_API_KEY')}")

        print(f"Starting email enrichment for {self}")
        if self.email:
            print(f"Skipping email enrichment for {self}: email already exists")
            return False
        if not all([self.first_name, self.last_name, self.company_domain_name]):
            print(f"Skipping email enrichment for {self}: missing required fields")
            return False

        url = "https://api.personmagic.io/email-finder"
        api_key = os.environ.get("LEADMAGIC_API_KEY")
        print(f"API Key: {api_key[:5]}...{api_key[-5:] if api_key else 'Not found'}")

        headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "X-API-Key": api_key,
        }
        payload = {
            "first_name": self.first_name,
            "last_name": self.last_name,
            "domain": self.company_domain_name,
        }

        print(f"Request URL: {url}")
        print(f"Request Headers: {headers}")
        print(f"Request Payload: {payload}")

        try:
            print(f"Sending request to PersonMagic API for {self}")
            response = requests.post(url, json=payload, headers=headers)
            print(f"Response Status Code: {response.status_code}")
            print(f"Response Headers: {response.headers}")
            print(f"Response Content: {response.text}")
            response.raise_for_status()
            data = response.json()
            print(f"Received response from PersonMagic API for {self}: {data}")

            if data.get("status") == "valid":
                self.email = data.get("email")
                self.save()
                print(f"Successfully enriched email for {self}: {self.email}")
                return True
            else:
                print(f"Failed to enrich email for {self}: {data.get('message')}")
        except requests.RequestException as e:
            print(f"Error enriching email for {self}: {str(e)}")
            if hasattr(e, "response"):
                print(f"Error Response Status Code: {e.response.status_code}")
                print(f"Error Response Headers: {e.response.headers}")
                print(f"Error Response Content: {e.response.text}")
        except Exception as e:
            print(f"Unexpected error enriching email for {self}: {str(e)}")

        return False
