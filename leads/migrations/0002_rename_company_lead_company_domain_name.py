# Generated by Django 5.1 on 2024-08-28 18:27

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("leads", "0001_initial"),
    ]

    operations = [
        migrations.RenameField(
            model_name="lead",
            old_name="company",
            new_name="company_domain_name",
        ),
    ]
