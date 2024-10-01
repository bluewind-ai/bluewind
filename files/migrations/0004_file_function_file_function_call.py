# Generated by Django 5.1.1 on 2024-10-01 19:37

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("files", "0003_initial"),
        ("function_calls", "0010_alter_functioncall_whole_tree"),
        ("functions", "0003_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="file",
            name="function",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="related_file",
                to="functions.function",
            ),
        ),
        migrations.AddField(
            model_name="file",
            name="function_call",
            field=models.ForeignKey(
                default=1,
                on_delete=django.db.models.deletion.CASCADE,
                to="function_calls.functioncall",
            ),
            preserve_default=False,
        ),
    ]
