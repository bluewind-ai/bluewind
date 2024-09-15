# Generated by Django 5.1.1 on 2024-09-15 14:09

import django.core.serializers.json
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("workspace_snapshots", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="FlowRun",
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
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("NOT_STARTED", "Not Started"),
                            ("IN_PROGRESS", "In Progress"),
                            ("COMPLETED", "Completed"),
                        ],
                        default="NOT_STARTED",
                        max_length=20,
                    ),
                ),
                ("state", models.JSONField(blank=True, default=dict)),
                ("create_new_workspace", models.BooleanField(default=False)),
                (
                    "input_data",
                    models.JSONField(
                        blank=True,
                        default=dict,
                        encoder=django.core.serializers.json.DjangoJSONEncoder,
                    ),
                ),
                (
                    "diff",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="flow_runs",
                        to="workspace_snapshots.workspacediff",
                    ),
                ),
            ],
            options={
                "abstract": False,
            },
        ),
    ]