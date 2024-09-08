# Generated by Django 5.1.1 on 2024-09-08 04:55

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("chat_messages", "0001_initial"),
        ("people", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="message",
            name="recipient",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="received_messages",
                to="people.person",
            ),
        ),
        migrations.AddField(
            model_name="message",
            name="sender",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="messages",
                to="people.person",
            ),
        ),
    ]
