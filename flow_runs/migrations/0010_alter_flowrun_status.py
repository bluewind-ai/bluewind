# Generated by Django 5.1.1 on 2024-09-25 15:30

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("flow_runs", "0009_flowrun_parent"),
    ]

    operations = [
        migrations.AlterField(
            model_name="flowrun",
            name="status",
            field=models.CharField(
                choices=[
                    ("conditions-not-met", "Conditions Not Met"),
                    ("ready-for-approval", "Ready for Approval"),
                    ("approved", "Approved"),
                    ("running", "Running"),
                    ("completed", "Completed"),
                ],
                default="conditions-not-met",
                max_length=20,
            ),
        ),
    ]
