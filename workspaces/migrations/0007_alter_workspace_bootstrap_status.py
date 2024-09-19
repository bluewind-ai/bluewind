# Generated by Django 5.1.1 on 2024-09-19 17:13

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("workspaces", "0006_rename_status_workspace_bootstrap_status"),
    ]

    operations = [
        migrations.AlterField(
            model_name="workspace",
            name="bootstrap_status",
            field=models.CharField(
                choices=[
                    ("not_started", "Not Started"),
                    ("pending", "Pending"),
                    ("done", "Done"),
                ],
                default="not_started",
                max_length=20,
            ),
        ),
    ]
