#!/bin/bash

# Load environment variables
sh pg_sync.sh

# Run Django management commands
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser --noinput --username wayne@bluewind.ai --email wayne@bluewind.ai

# Set password for superuser
python manage.py shell -c "
from django.contrib.auth import get_user_model;
User = get_user_model();
user = User.objects.get(username='wayne@bluewind.ai');
user.set_password('W5\$HZ?9iSnw7BDaasLBD');
user.save()"

# Create Workspace, WorkspaceUser, and Anonymous User
python manage.py shell -c "
from workspaces.models import Workspace, WorkspaceUser;
from django.contrib.auth import get_user_model;
User = get_user_model();

# Superuser creation and workspace association
superuser = User.objects.get(username='wayne@bluewind.ai');
superuser_workspace = Workspace.objects.create(name='superuser', user=superuser);

# Anonymous user creation and workspace association
anonymous_user = User.objects.create_user(username='anonymous_user', email='anonymous@example.com', password='AnonymousSecurePassword123!');

anonymous_workspace = Workspace.objects.create(name='Anonymous Workspace', user=superuser);
WorkspaceUser.objects.create(user=anonymous_user, workspace=anonymous_workspace, is_default=True)"

# Start the Django development server
daphne -b 0.0.0.0 -p 8000 bluewind.asgi:application
