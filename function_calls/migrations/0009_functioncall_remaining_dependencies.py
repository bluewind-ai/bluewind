# Generated by Django 5.1.1 on 2024-09-29 03:02

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("function_calls", "0008_remove_functioncall_input_data_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="functioncall",
            name="remaining_dependencies",
            field=models.IntegerField(default=0),
        ),
    ]