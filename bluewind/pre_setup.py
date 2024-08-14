def pre_setup():
    import subprocess

    subprocess.run(['python', 'manage.py', 'makemigrations'], check=True)
    subprocess.run(['python', 'manage.py', 'migrate'], check=True)
    subprocess.run(['python', 'manage.py', 'collectstatic', '--noinput'], check=True)



    subprocess.run([
        'python', 'manage.py', 'createsuperuser',
        '--noinput'
    ])
