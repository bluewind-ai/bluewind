# Generated by Django 5.1.1 on 2024-09-11 22:11

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
        ),
    ]
