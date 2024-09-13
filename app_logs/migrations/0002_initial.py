# Generated by Django 5.1.1 on 2024-09-13 03:02

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("app_logs", "0001_initial"),
        ("workspaces", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="applog",
            name="user",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL
            ),
        ),
        migrations.AddField(
            model_name="applog",
            name="workspace",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE, to="workspaces.workspace"
            ),
        ),
        migrations.AddIndex(
            model_name="applog",
            index=models.Index(
                fields=["request_id"], name="app_logs_ap_request_a8cee2_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="applog",
            index=models.Index(
                fields=["timestamp"], name="app_logs_ap_timesta_4a73d8_idx"
            ),
        ),
    ]
