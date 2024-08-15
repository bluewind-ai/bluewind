import os


def pre_setup():
    import subprocess

    subprocess.run(['python', 'manage.py', 'makemigrations'], check=True)
    subprocess.run(['python', 'manage.py', 'migrate'], check=True)
    subprocess.run(['python', 'manage.py', 'collectstatic', '--noinput'], check=True)

    # first, update the password for the admin user, in case it changed
    process = subprocess.Popen(
        ['python', 'manage.py', 'changepassword', os.environ.get('DJANGO_SUPERUSER_PASSWORD')],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        universal_newlines=True
    )
    # sometimes the environment is new and there is no superuser yet, if that's the case, update it.
    subprocess.run([
        'python', 'manage.py', 'createsuperuser',
        '--noinput'
    ])
