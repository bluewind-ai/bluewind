# Generated by Django 5.1 on 2024-09-01 05:19

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("channels", "0004_rename_token_channel_access_token_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="channel",
            name="client_id",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="channel",
            name="client_secret",
            field=models.TextField(blank=True, null=True),
        ),
    ]
