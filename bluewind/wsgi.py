"""
WSGI config for bluewind project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bluewind.settings')

if 'gunicorn' in os.environ.get('SERVER_SOFTWARE', ''):
    # this hack allows us to run migrations and build static files when the fargate worker starts
    # Why do this? Because it's incredibly simpler than doing it in github actions.
    # We have this if statement to avoid running this code when wsgi is just imported.
    from bluewind.pre_setup import pre_setup
    pre_setup()

application = get_wsgi_application()