from django.core.management.base import BaseCommand
import subprocess
import os

class Command(BaseCommand):
    help = 'Performs pre-setup tasks including migrations, static file collection, and superuser creation/update'

    def handle(self, *args, **options):
        self.stdout.write('Starting pre-setup...')
        pre_setup()
        self.stdout.write(self.style.SUCCESS('Pre-setup completed successfully'))

def pre_setup():
    subprocess.run(['python', 'manage.py', 'makemigrations'], check=True)
    subprocess.run(['python', 'manage.py', 'migrate'], check=True)
    subprocess.run(['python', 'manage.py', 'collectstatic', '--noinput'], check=True)

    # sometimes the environment is new and there is no superuser yet, if that's the case, update it.
    try:
        subprocess.run([
            'python', 'manage.py', 'createsuperuser',
            '--noinput'
        ], check=True)
    except subprocess.CalledProcessError:
        pass  # Superuser likely already exists

    email = os.environ.get('DJANGO_SUPERUSER_EMAIL')
    username = os.environ.get('DJANGO_SUPERUSER_USERNAME')
    password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')
    
    if all([email, username, password]):
        update_command = f"""from django.contrib.auth import get_user_model;
User = get_user_model();
user = User.objects.get(username='{username}');
user.set_password('{password}');
user.email = '{email}';
user.save()"""

        subprocess.run([
            'python', 'manage.py', 'shell', '-c', update_command
        ], check=True)