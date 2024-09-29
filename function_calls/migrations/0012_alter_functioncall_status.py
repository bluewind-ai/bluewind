# Generated by Django 5.1.1 on 2024-09-29 18:07

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("function_calls", "0011_alter_functioncall_status"),
    ]

    operations = [
        migrations.AlterField(
            model_name="functioncall",
            name="status",
            field=models.CharField(
                choices=[
                    ("conditions-not-met", "Conditions Not Met"),
                    ("ready-for-approval", "Ready for Approval"),
                    ("running", "Running"),
                    ("completed", "Completed"),
                    ("completed-ready-for-approval", "Completed Ready for Approval"),
                    ("marked-successful", "Marked Successful"),
                    ("marked-failed", "Marked Failed"),
                    ("successful", "Successful"),
                ],
                default="conditions-not-met",
                max_length=35,
            ),
        ),
    ]
