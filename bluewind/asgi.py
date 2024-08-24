"""
ASGI config for bluewind project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bluewind.settings_prod')

application = get_asgi_application()

if __name__ == "__main__":
    from bluewind.pre_setup import pre_setup
    pre_setup()
