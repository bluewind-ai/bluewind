# Generated by Django 5.1.1 on 2024-09-20 00:36

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("channels", "0001_initial"),
        ("credentials", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="channel",
            name="gmail_credentials",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                to="credentials.credentials",
            ),
        ),
    ]
