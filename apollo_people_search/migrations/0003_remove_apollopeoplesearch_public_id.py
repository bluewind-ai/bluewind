# Generated by Django 5.1 on 2024-09-02 04:12

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("apollo_people_search", "0002_initial"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="apollopeoplesearch",
            name="public_id",
        ),
    ]
