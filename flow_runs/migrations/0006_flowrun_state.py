# Generated by Django 5.1.1 on 2024-09-23 16:56

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("flow_runs", "0005_flowrun_status"),
    ]

    operations = [
        migrations.AddField(
            model_name="flowrun",
            name="state",
            field=models.JSONField(default=dict),
        ),
    ]