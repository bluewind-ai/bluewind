# Generated by Django 5.1.1 on 2024-09-20 00:36

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("action_runs", "0003_initial"),
        ("flow_runs", "0002_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="StepRun",
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
                ("start_date", models.DateTimeField(auto_now_add=True)),
                ("end_date", models.DateTimeField(blank=True, null=True)),
                (
                    "action_run",
                    models.OneToOneField(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="associated_step_run",
                        to="action_runs.actionrun",
                    ),
                ),
                (
                    "flow_run",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="step_runs",
                        to="flow_runs.flowrun",
                    ),
                ),
            ],
            options={
                "abstract": False,
            },
        ),
    ]
