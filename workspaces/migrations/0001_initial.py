# Generated by Django 5.1 on 2024-09-02 02:39

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Workspace",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=100)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                (
                    "public_id",
                    models.CharField(editable=False, max_length=100, unique=True),
                ),
            ],
        ),
        migrations.CreateModel(
            name="WorkspaceUser",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("is_default", models.BooleanField(default=False)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="workspaces.workspace",
                    ),
                ),
            ],
            options={
                "unique_together": {("user", "workspace")},
            },
        ),
        migrations.AddField(
            model_name="workspace",
            name="users",
            field=models.ManyToManyField(
                through="workspaces.WorkspaceUser", to=settings.AUTH_USER_MODEL
            ),
        ),
    ]
