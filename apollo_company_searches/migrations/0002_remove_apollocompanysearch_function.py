# Generated by Django 5.1.1 on 2024-10-06 16:07

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("apollo_company_searches", "0001_initial"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="apollocompanysearch",
            name="function",
        ),
    ]
