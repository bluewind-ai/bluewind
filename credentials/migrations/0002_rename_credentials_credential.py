# Generated by Django 5.1.1 on 2024-10-07 04:10

from django.conf import settings
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("credentials", "0001_initial"),
        ("function_calls", "0003_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RenameModel(
            old_name="Credentials",
            new_name="Credential",
        ),
    ]
