# Generated by Django 5.1 on 2024-08-29 23:40

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("channels", "0002_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="channel",
            name="gmail_expiration",
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
        migrations.AddField(
            model_name="channel",
            name="gmail_history_id",
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
    ]
