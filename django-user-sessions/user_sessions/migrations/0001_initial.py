# Generated by Django 5.1 on 2024-09-01 23:55

import user_sessions.models
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Session",
            fields=[
                (
                    "session_key",
                    models.CharField(
                        max_length=40,
                        primary_key=True,
                        serialize=False,
                        verbose_name="session key",
                    ),
                ),
                ("session_data", models.TextField(verbose_name="session data")),
                (
                    "expire_date",
                    models.DateTimeField(db_index=True, verbose_name="expire date"),
                ),
                ("user_agent", models.CharField(blank=True, max_length=200, null=True)),
                ("last_activity", models.DateTimeField(auto_now=True)),
                (
                    "ip",
                    models.GenericIPAddressField(
                        blank=True, null=True, verbose_name="IP"
                    ),
                ),
            ],
            options={
                "verbose_name": "session",
                "verbose_name_plural": "sessions",
                "abstract": False,
            },
            managers=[
                ("objects", user_sessions.models.SessionManager()),
            ],
        ),
    ]
