# Generated by Django 5.1.1 on 2024-09-18 00:29

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("apps", "0001_initial"),
        ("models", "0007_alter_model_unique_together_remove_model_name"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="model",
            name="app_label",
        ),
        migrations.AddField(
            model_name="model",
            name="app",
            field=models.ForeignKey(
                default=1,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="models",
                to="apps.app",
            ),
            preserve_default=False,
        ),
    ]
