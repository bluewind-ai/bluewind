# Generated by Django 5.1 on 2024-09-03 19:41

import model_clone.mixin
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="IncomingWebhook",
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
                ("headers", models.JSONField()),
                ("payload", models.JSONField()),
                ("method", models.CharField(max_length=10)),
                ("ip_address", models.GenericIPAddressField()),
                ("url", models.URLField()),
            ],
            bases=(model_clone.mixin.CloneMixin, models.Model),
        ),
    ]
