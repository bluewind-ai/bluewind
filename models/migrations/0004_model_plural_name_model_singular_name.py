# Generated by Django 5.1.1 on 2024-10-01 16:23

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("models", "0003_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="model",
            name="plural_name",
            field=models.CharField(default=1, max_length=255),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="model",
            name="singular_name",
            field=models.CharField(default=1, max_length=255),
            preserve_default=False,
        ),
    ]
