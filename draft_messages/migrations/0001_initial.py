# Generated by Django 5.1.1 on 2024-09-09 16:38

import django.db.models.deletion
import model_clone.mixin
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("channels", "0002_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="DraftMessage",
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
                ("content", models.TextField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("subject", models.CharField(blank=True, max_length=255, null=True)),
                (
                    "gmail_draft_id",
                    models.CharField(blank=True, max_length=255, null=True),
                ),
                (
                    "channel",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="draft_messages",
                        to="channels.channel",
                    ),
                ),
            ],
            bases=(model_clone.mixin.CloneMixin, models.Model),
        ),
    ]
