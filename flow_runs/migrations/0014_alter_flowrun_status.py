# Generated by Django 5.1.1 on 2024-09-26 00:46

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("flow_runs", "0013_alter_flowrun_status"),
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
                    (
                        "completed-waiting-for-approval",
                        "Completed Waiting for Approval",
                    ),
                    ("marked-successful", "Marked Successful"),
                    ("marked-failed", "Marked Failed"),
                    ("successful", "Successful"),
                ],
                default="conditions-not-met",
                max_length=35,
            ),
        ),
    ]
