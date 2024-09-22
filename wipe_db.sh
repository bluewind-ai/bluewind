#!/bin/bash

# Load environment variables
source .env

# Check if the role exists, if not create it
psql postgres -c "DO
\$do\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'dbadmin') THEN
      CREATE ROLE dbadmin WITH LOGIN PASSWORD '$DB_PASSWORD';
   END IF;
END
\$do\$;"

echo "Role check/creation completed."

psql postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
createdb $DB_NAME

echo "Database dropped (if existed) and recreated."

# Grant privileges to dbadmin
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO dbadmin;"
psql $DB_NAME -c "ALTER SCHEMA public OWNER TO dbadmin;"

echo "Privileges granted to dbadmin."

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
python manage.py rungunicorn
