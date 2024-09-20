# Generated by Django 5.1.1 on 2024-09-20 03:06

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("files", "0003_initial"),
        ("workspaces", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="file",
            name="path",
            field=models.CharField(help_text="The file path.", max_length=255),
        ),
        migrations.AlterUniqueTogether(
            name="file",
            unique_together={("workspace", "path")},
        ),
    ]
