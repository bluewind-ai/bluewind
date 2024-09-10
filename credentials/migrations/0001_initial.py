# Generated by Django 5.1.1 on 2024-09-10 00:09

import encrypted_fields.fields
import model_clone.mixin
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Credentials",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("key", models.CharField(max_length=255)),
                (
                    "value",
                    encrypted_fields.fields.EncryptedCharField(max_length=100000),
                ),
            ],
            options={
                "verbose_name_plural": "Credentials",
            },
            bases=(model_clone.mixin.CloneMixin, models.Model),
        ),
    ]
