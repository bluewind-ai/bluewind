# Generated by Django 5.1 on 2024-09-02 00:07

import bluewind.utils
import django.db.models.deletion
import model_clone.mixin
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("channels", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Message",
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
                ("content", models.TextField()),
                ("timestamp", models.DateTimeField(auto_now_add=True)),
                ("is_read", models.BooleanField(default=False)),
                ("subject", models.CharField(blank=True, max_length=255, null=True)),
                (
                    "gmail_message_id",
                    models.CharField(blank=True, max_length=255, null=True),
                ),
                (
                    "channel",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="sent_messages",
                        to="channels.channel",
                    ),
                ),
            ],
            bases=(model_clone.mixin.CloneMixin, models.Model),
        ),
    ]
