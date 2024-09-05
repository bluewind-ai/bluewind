# Generated by Django 5.1.1 on 2024-09-05 04:27

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("chat_messages", "0002_initial"),
        ("workspaces", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="message",
            name="workspace",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE, to="workspaces.workspace"
            ),
        ),
        migrations.AlterUniqueTogether(
            name="message",
            unique_together={("workspace", "gmail_message_id")},
        ),
    ]
