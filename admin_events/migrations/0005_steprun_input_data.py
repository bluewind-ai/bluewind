# Generated by Django 5.1.1 on 2024-09-08 04:20

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("admin_events", "0004_remove_steprun_input_data"),
    ]

    operations = [
        migrations.AddField(
            model_name="steprun",
            name="input_data",
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
