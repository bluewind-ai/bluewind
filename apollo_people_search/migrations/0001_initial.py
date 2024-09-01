# Generated by Django 5.1 on 2024-09-01 02:37

import model_clone.mixin

import bluewind.utils
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="ApolloPeopleSearch",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=bluewind.utils.uuid7,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "public_id",
                    models.CharField(editable=False, max_length=100, unique=True),
                ),
                ("name", models.CharField(max_length=255)),
                (
                    "person_titles",
                    models.JSONField(
                        blank=True, help_text="Array of person's titles", null=True
                    ),
                ),
                (
                    "q_keywords",
                    models.CharField(
                        blank=True,
                        help_text="Keywords to filter results",
                        max_length=255,
                    ),
                ),
                (
                    "prospected_by_current_team",
                    models.JSONField(
                        blank=True,
                        help_text="Array of 'yes' or 'no' strings",
                        null=True,
                    ),
                ),
                (
                    "person_locations",
                    models.JSONField(
                        blank=True,
                        help_text="Array of allowed person locations",
                        null=True,
                    ),
                ),
                (
                    "person_seniorities",
                    models.JSONField(
                        blank=True, help_text="Array of seniority levels", null=True
                    ),
                ),
                (
                    "contact_email_status",
                    models.JSONField(
                        blank=True, help_text="Array of email statuses", null=True
                    ),
                ),
                (
                    "q_organization_domains",
                    models.TextField(
                        blank=True, help_text="Company domains separated by newline"
                    ),
                ),
                (
                    "organization_locations",
                    models.JSONField(
                        blank=True,
                        help_text="Array of allowed organization locations",
                        null=True,
                    ),
                ),
                (
                    "organization_ids",
                    models.JSONField(
                        blank=True, help_text="Array of organization IDs", null=True
                    ),
                ),
                (
                    "organization_num_employees_ranges",
                    models.JSONField(
                        blank=True,
                        help_text="Array of employee count ranges",
                        null=True,
                    ),
                ),
                (
                    "page",
                    models.PositiveIntegerField(
                        default=1, help_text="Page number for pagination"
                    ),
                ),
                (
                    "per_page",
                    models.PositiveIntegerField(
                        default=10, help_text="Number of results per page (1-100)"
                    ),
                ),
            ],
            options={
                "verbose_name": "Apollo People Search",
                "verbose_name_plural": "Apollo People Searches",
            },
            bases=(model_clone.mixin.CloneMixin, models.Model),
        ),
    ]
