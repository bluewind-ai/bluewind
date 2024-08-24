import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bluewind.settings_prod')

if 'gunicorn' in os.environ.get('SERVER_SOFTWARE', ''):
    from dotenv import load_dotenv
    load_dotenv()
    # this hack allows us to run migrations and build static files when the fargate worker starts
    # Why do this? Because it's incredibly simpler than doing it in github actions.
    # We have this if statement to avoid running this code when wsgi is just imported.
    from bluewind.management.commands.pre_setup import Command

    # Create an instance of the Command class and call its handle method
    pre_setup_command = Command()
    pre_setup_command.handle()

application = get_wsgi_application()