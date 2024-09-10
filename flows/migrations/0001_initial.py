# Generated by Django 5.1.1 on 2024-09-10 00:21

import django.core.serializers.json
import model_clone.mixin
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Action",
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
                (
                    "action_type",
                    models.CharField(
                        choices=[
                            ("CREATE", "Create"),
                            ("SAVE", "Save"),
                            ("DELETE", "Delete"),
                            ("ACTION", "Action"),
                            ("SELECT", "Select"),
                            ("LIST_VIEW", "List View"),
                        ],
                        max_length=20,
                    ),
                ),
                ("action_input", models.JSONField(blank=True, default=dict)),
            ],
        ),
        migrations.CreateModel(
            name="ActionRun",
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
                ("timestamp", models.DateTimeField(auto_now_add=True)),
                ("model_name", models.CharField(max_length=100)),
                ("object_id", models.IntegerField(blank=True, null=True)),
                (
                    "data",
                    models.JSONField(
                        encoder=django.core.serializers.json.DjangoJSONEncoder
                    ),
                ),
            ],
            options={
                "abstract": False,
            },
            bases=(model_clone.mixin.CloneMixin, models.Model),
        ),
        migrations.CreateModel(
            name="Flow",
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
                ("name", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "abstract": False,
            },
            bases=(model_clone.mixin.CloneMixin, models.Model),
        ),
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
            ],
            options={
                "abstract": False,
            },
            bases=(model_clone.mixin.CloneMixin, models.Model),
        ),
        migrations.CreateModel(
            name="FlowStep",
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
                (
                    "action_type",
                    models.CharField(
                        choices=[
                            ("CREATE", "Create"),
                            ("SAVE", "Save"),
                            ("DELETE", "Delete"),
                            ("ACTION", "Action"),
                            ("SELECT", "Select"),
                            ("LIST_VIEW", "List View"),
                        ],
                        default="ACTION",
                        max_length=10,
                    ),
                ),
                ("default_values", models.JSONField(blank=True, default=dict)),
            ],
            options={
                "abstract": False,
            },
            bases=(model_clone.mixin.CloneMixin, models.Model),
        ),
        migrations.CreateModel(
            name="Model",
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
                ("name", models.CharField(max_length=100)),
                ("app_label", models.CharField(max_length=100)),
            ],
            options={
                "ordering": ["app_label", "name"],
            },
            bases=(model_clone.mixin.CloneMixin, models.Model),
        ),
        migrations.CreateModel(
            name="Recording",
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
                ("name", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                ("start_time", models.DateTimeField()),
                ("end_time", models.DateTimeField(blank=True, null=True)),
            ],
            options={
                "abstract": False,
            },
            bases=(model_clone.mixin.CloneMixin, models.Model),
        ),
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
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("input_data", models.JSONField(blank=True, default=dict)),
                ("result", models.JSONField(blank=True, default=dict)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("PENDING", "Pending"),
                            ("IN_PROGRESS", "In Progress"),
                            ("COMPLETED", "Completed"),
                            ("ERROR", "Error"),
                        ],
                        default="PENDING",
                        max_length=20,
                    ),
                ),
            ],
            options={
                "abstract": False,
            },
            bases=(model_clone.mixin.CloneMixin, models.Model),
        ),
    ]
