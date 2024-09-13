# Generated by Django 5.1.1 on 2024-09-13 03:02

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("draft_messages", "0001_initial"),
        ("people", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="draftmessage",
            name="recipient",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="received_draft_messages",
                to="people.person",
            ),
        ),
        migrations.AddField(
            model_name="draftmessage",
            name="sender",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="draft_messages",
                to="people.person",
            ),
        ),
    ]
