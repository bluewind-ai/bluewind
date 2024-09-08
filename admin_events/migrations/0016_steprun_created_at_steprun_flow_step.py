# Generated by Django 5.1.1 on 2024-09-08 03:36

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("admin_events", "0015_flowrun_status"),
    ]

    operations = [
        migrations.AddField(
            model_name="steprun",
            name="created_at",
            field=models.DateTimeField(auto_now_add=True, default=1),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="steprun",
            name="flow_step",
            field=models.ForeignKey(
                default=1,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="step_runs",
                to="admin_events.flowstep",
            ),
            preserve_default=False,
        ),
    ]