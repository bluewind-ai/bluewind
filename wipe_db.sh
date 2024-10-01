#!/bin/bash

# Load environment variables
set -a
. ./.env
set +a

# Use environment variables or default values
DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-appbluewinddb}
DB_USERNAME=${DB_USERNAME:-dbadmin}
DB_PASSWORD=${DB_PASSWORD:-zYx8mQTqAe9r8A99thazK}

# Stop and restart PostgreSQL service
brew services stop postgresql@16
brew services start postgresql@16

echo "PostgreSQL service restarted."

# Check if the role exists, if not create it
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d postgres -c "DO
\$do\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USERNAME') THEN
      CREATE ROLE $DB_USERNAME WITH LOGIN PASSWORD '$DB_PASSWORD';
   END IF;
END
\$do\$;"

echo "Role check/creation completed."

# Terminate existing connections
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d postgres -c "
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = '$DB_NAME'
  AND pid <> pg_backend_pid();"

echo "Existing connections terminated."

# Drop and recreate the database
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME WITH (FORCE);"
PGPASSWORD=$DB_PASSWORD createdb -h $DB_HOST -p $DB_PORT -U $DB_USERNAME $DB_NAME

echo "Database dropped (if existed) and recreated."

# Grant privileges to dbadmin
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USERNAME;"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_NAME -c "ALTER SCHEMA public OWNER TO $DB_USERNAME;"

echo "Privileges granted to $DB_USERNAME."

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

echo "Database setup and initial data creation completed."

gunicorn -c gunicorn_config.py bluewind.wsgi:application
