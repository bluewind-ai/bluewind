# Generated by Django 5.1.1 on 2024-09-15 19:17

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("models", "0002_model_content"),
    ]

    operations = [
        migrations.AddField(
            model_name="model",
            name="app_label",
            field=models.CharField(default=1, max_length=100),
            preserve_default=False,
        ),
    ]
