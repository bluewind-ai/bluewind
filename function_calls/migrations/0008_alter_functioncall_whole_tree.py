# Generated by Django 5.1.1 on 2024-09-30 19:35

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("function_calls", "0007_remove_functioncall_root_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="functioncall",
            name="whole_tree",
            field=models.JSONField(),
        ),
    ]
