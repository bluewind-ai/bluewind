# Generated by Django 5.1.1 on 2024-09-28 00:18

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("function_calls", "0002_remove_functioncall_output_data_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="functioncall",
            name="long_description",
            field=models.TextField(
                blank=True,
                help_text="A detailed description of the function call, its purpose, and any additional context.",
                null=True,
            ),
        ),
    ]
