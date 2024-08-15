import os


def pre_setup():
    import subprocess

    subprocess.run(['python', 'manage.py', 'makemigrations'], check=True)
    subprocess.run(['python', 'manage.py', 'migrate'], check=True)
    subprocess.run(['python', 'manage.py', 'collectstatic', '--noinput'], check=True)

    # sometimes the environment is new and there is no superuser yet, if that's the case, update it.
    subprocess.run([
        'python', 'manage.py', 'createsuperuser',
        '--noinput'
    ])
    email = os.environ.get('DJANGO_SUPERUSER_EMAIL')
    username = os.environ.get('DJANGO_SUPERUSER_USERNAME')
    password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')
    
    subprocess.run([
        'python', 'manage.py', 'shell', '-c',
        f"""from django.contrib.auth import get_user_model;
User = get_user_model();
user = User.objects.get(username='{username}');
user.set_password('{password}');
user.email = '{email}';
user.save()"""
    ])
