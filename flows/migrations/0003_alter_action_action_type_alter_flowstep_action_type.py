# Generated by Django 5.1.1 on 2024-09-09 22:22

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("flows", "0002_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="action",
            name="action_type",
            field=models.CharField(
                choices=[
                    ("CREATE", "Create"),
                    ("SAVE", "Save"),
                    ("DELETE", "Delete"),
                    ("ACTION", "Action"),
                    ("SELECT", "Select"),
                    ("LIST_VIEW", "List View"),
                ],
                default="ACTION",
                max_length=10,
            ),
        ),
        migrations.AlterField(
            model_name="flowstep",
            name="action_type",
            field=models.CharField(
                choices=[
                    ("CREATE", "Create"),
                    ("SAVE", "Save"),
                    ("DELETE", "Delete"),
                    ("ACTION", "Action"),
                    ("SELECT", "Select"),
                    ("LIST_VIEW", "List View"),
                ],
                default="ACTION",
                max_length=10,
            ),
        ),
    ]