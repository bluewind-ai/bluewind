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

# Create Workspace and WorkspaceUser
python manage.py shell -c "
from workspaces.models import Workspace, WorkspaceUser;
from django.contrib.auth import get_user_model;
User = get_user_model();
superuser = User.objects.get(username='wayne@bluewind.ai');
superuser_workspace = Workspace.objects.create(name='superuser');
WorkspaceUser.objects.create(user=superuser, workspace=superuser_workspace, is_default=True);
anonymous_workspace, created = Workspace.objects.get_or_create(name='Anonymous Workspace');
WorkspaceUser.objects.get_or_create(user=superuser, workspace=anonymous_workspace, is_default=False)"

# Start the Django development server
python manage.py runserver
