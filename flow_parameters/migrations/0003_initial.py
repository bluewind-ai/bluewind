# Generated by Django 5.1.1 on 2024-09-20 00:36

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("flow_parameters", "0002_initial"),
        ("models", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="flowparameter",
            name="model",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE, to="models.model"
            ),
        ),
    ]
