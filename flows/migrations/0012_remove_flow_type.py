# Generated by Django 5.1.1 on 2024-09-17 20:24

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("flows", "0011_delete_recording"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="flow",
            name="type",
        ),
    ]