from django.db import migrations

from api_providers.models import ApiProvider

def add_data(apps, schema_editor):
    ApiProvider.objects.create(name='leadmagic')

def reverse_data(apps, schema_editor):
    ApiProvider.objects.filter(name='leadmagic').delete()

class Migration(migrations.Migration):

    dependencies = [
        ('api_providers', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(add_data, reverse_data),
    ]