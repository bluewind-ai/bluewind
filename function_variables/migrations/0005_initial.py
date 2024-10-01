# Generated by Django 5.1.1 on 2024-09-30 18:51

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("function_variables", "0004_initial"),
        ("workspaces", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="functionvariable",
            name="workspace",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE, to="workspaces.workspace"
            ),
        ),
        migrations.AlterUniqueTogether(
            name="functionvariable",
            unique_together={("function", "name")},
        ),
    ]