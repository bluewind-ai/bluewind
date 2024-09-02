# Generated by Django 5.1 on 2024-09-02 18:38

import model_clone.mixin
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("webhook_tester", "0002_remove_webhooktest_response_content_and_more"),
    ]

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
            ],
            bases=(model_clone.mixin.CloneMixin, models.Model),
        ),
    ]
