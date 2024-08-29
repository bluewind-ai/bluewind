# Generated by Django 5.1 on 2024-08-29 04:34

import bluewind.utils
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Person",
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
                ("first_name", models.CharField(max_length=100)),
                ("last_name", models.CharField(max_length=100)),
                ("email", models.EmailField(blank=True, max_length=254)),
                ("linkedin_url", models.URLField(blank=True, null=True)),
                ("phone", models.CharField(blank=True, max_length=20)),
                ("company_domain_name", models.CharField(blank=True, max_length=100)),
                ("company_linkedin_url", models.URLField(blank=True, null=True)),
                ("workspace_public_id", models.CharField(blank=True, max_length=50)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("NEW", "New"),
                            ("CONTACTED", "Contacted"),
                            ("QUALIFIED", "Qualified"),
                            ("LOST", "Lost"),
                            ("CONVERTED", "Converted"),
                        ],
                        default="NEW",
                        max_length=20,
                    ),
                ),
                ("source", models.CharField(blank=True, max_length=50)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "abstract": False,
            },
        ),
    ]