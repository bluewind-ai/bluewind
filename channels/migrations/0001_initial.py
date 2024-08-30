# Generated by Django 5.1 on 2024-08-30 23:25

import bluewind.utils
import model_clone.mixin
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Channel",
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
                ("email", models.EmailField(max_length=254)),
                (
                    "gmail_history_id",
                    models.CharField(blank=True, max_length=20, null=True),
                ),
                (
                    "gmail_expiration",
                    models.CharField(blank=True, max_length=20, null=True),
                ),
                ("last_synced", models.DateTimeField(blank=True, null=True)),
            ],
            bases=(model_clone.mixin.CloneMixin, models.Model),
        ),
    ]
