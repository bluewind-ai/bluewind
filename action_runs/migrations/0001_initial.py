# Generated by Django 5.1.1 on 2024-09-10 00:09

import django.core.serializers.json
import model_clone.mixin
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
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
    ]
