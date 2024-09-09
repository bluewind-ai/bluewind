# Generated by Django 5.1.1 on 2024-09-09 21:42

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("forms", "0001_initial"),
        ("workspaces", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="form",
            name="workspace",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE, to="workspaces.workspace"
            ),
        ),
        migrations.AddField(
            model_name="wizard",
            name="workspace",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE, to="workspaces.workspace"
            ),
        ),
        migrations.AddField(
            model_name="wizardstep",
            name="form",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE, to="forms.form"
            ),
        ),
        migrations.AddField(
            model_name="wizardstep",
            name="workspace",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE, to="workspaces.workspace"
            ),
        ),
        migrations.AddField(
            model_name="wizard",
            name="steps",
            field=models.ManyToManyField(to="forms.wizardstep"),
        ),
    ]
