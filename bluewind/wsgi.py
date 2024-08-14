"""
WSGI config for bluewind project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bluewind.settings')

application = get_wsgi_application()

if __name__ == "__main__":
    from bluewind.pre_setup import pre_setup
    pre_setup()