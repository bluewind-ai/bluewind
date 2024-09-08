# Generated by Django 5.1.1 on 2024-09-08 03:37

import model_clone.mixin
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="GmailSubscription",
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
                ("push_endpoint", models.URLField()),
            ],
            options={
                "abstract": False,
            },
            bases=(model_clone.mixin.CloneMixin, models.Model),
        ),
        migrations.CreateModel(
            name="PubSubTopic",
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
                ("project_id", models.CharField(max_length=100)),
                ("topic_id", models.CharField(max_length=100)),
            ],
            bases=(model_clone.mixin.CloneMixin, models.Model),
        ),
    ]
