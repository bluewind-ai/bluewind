# Generated by Django 5.1.1 on 2024-09-30 19:55

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("function_calls", "0009_alter_functioncall_whole_tree"),
    ]

    operations = [
        migrations.AlterField(
            model_name="functioncall",
            name="whole_tree",
            field=models.JSONField(),
        ),
    ]
