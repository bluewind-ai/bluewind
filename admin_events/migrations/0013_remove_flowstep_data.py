# Generated by Django 5.1.1 on 2024-09-08 02:44

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("admin_events", "0012_remove_flowstep_action_flowstep_action_type"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="flowstep",
            name="data",
        ),
    ]