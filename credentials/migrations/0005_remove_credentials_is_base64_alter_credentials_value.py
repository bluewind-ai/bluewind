# Generated by Django 5.1 on 2024-09-03 03:49

import encrypted_fields.fields
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("credentials", "0004_alter_credentials_value"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="credentials",
            name="is_base64",
        ),
        migrations.AlterField(
            model_name="credentials",
            name="value",
            field=encrypted_fields.fields.EncryptedCharField(max_length=1000),
        ),
    ]
