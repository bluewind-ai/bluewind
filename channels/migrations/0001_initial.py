# Generated by Django 5.1 on 2024-09-02 00:20

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
                ("access_token", models.TextField(blank=True, null=True)),
                ("refresh_token", models.TextField(blank=True, null=True)),
                ("token_expiry", models.DateTimeField(blank=True, null=True)),
                ("client_id", models.TextField(blank=True, null=True)),
                ("client_secret", models.TextField(blank=True, null=True)),
            ],
            bases=(model_clone.mixin.CloneMixin, models.Model),
        ),
    ]
