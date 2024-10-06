# Generated by Django 5.1.1 on 2024-10-06 02:48

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("dns_records", "0001_initial"),
        ("domain_names", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="dnsrecord",
            name="domain",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="dns_records",
                to="domain_names.domainname",
            ),
        ),
        migrations.AlterUniqueTogether(
            name="dnsrecord",
            unique_together={("domain", "name", "record_type", "value", "priority")},
        ),
    ]
