# Generated by Django 5.1.1 on 2024-09-16 00:28

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("files", "0004_remove_file_file"),
        ("models", "0003_model_app_label"),
    ]

    operations = [
        migrations.AddField(
            model_name="model",
            name="file",
            field=models.ForeignKey(
                default=1,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="models",
                to="files.file",
            ),
            preserve_default=False,
        ),
    ]