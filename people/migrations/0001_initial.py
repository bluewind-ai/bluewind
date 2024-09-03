# Generated by Django 5.1 on 2024-09-03 02:58

import model_clone.mixin
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
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("first_name", models.CharField(blank=True, max_length=10)),
                ("last_name", models.CharField(blank=True, max_length=100)),
                ("email", models.EmailField(blank=True, max_length=254)),
                ("linkedin_url", models.URLField(blank=True, null=True)),
                ("phone", models.CharField(blank=True, max_length=20)),
                ("company_domain_name", models.CharField(blank=True, max_length=100)),
                ("company_linkedin_url", models.URLField(blank=True, null=True)),
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
            bases=(model_clone.mixin.CloneMixin, models.Model),
        ),
    ]
