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
    email = models.EmailField(blank=True, null=True)
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
        constraints = [
            models.UniqueConstraint(
                fields=["email", "workspace"],
                condition=models.Q(email__isnull=False),
                name="unique_email_per_workspace",
            )
        ]

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
        if self.email:
            return False
        if not all([self.first_name, self.last_name, self.company_domain_name]):
            return False

        url = "https://api.personmagic.io/email-finder"
        api_key = os.environ.get("LEADMAGIC_API_KEY")

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

        response = requests.post(url, json=payload, headers=headers)

        response.raise_for_status()
        data = response.json()

        if data.get("status") == "valid":
            self.email = data.get("email")
            self.save()

            return True

        return False
