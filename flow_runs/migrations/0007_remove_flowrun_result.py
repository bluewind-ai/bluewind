# Generated by Django 5.1.1 on 2024-09-17 00:47

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("flow_runs", "0006_flowrun_output_data"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="flowrun",
            name="result",
        ),
    ]
