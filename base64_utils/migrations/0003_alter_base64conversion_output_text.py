# Generated by Django 5.1 on 2024-09-03 18:24

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("base64_utils", "0002_alter_base64conversion_output_text"),
    ]

    operations = [
        migrations.AlterField(
            model_name="base64conversion",
            name="output_text",
            field=models.TextField(),
        ),
    ]
