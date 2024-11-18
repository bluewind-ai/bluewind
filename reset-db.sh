#!/bin/bash

# Load environment variables
set -a
. ./.env
set +a

# Use environment variables or default values
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-bluewind}
DB_USERNAME=${DB_USERNAME:-merwanehamadi}
DB_PASSWORD=${DB_PASSWORD:-your_password}

# Stop and restart PostgreSQL service
brew services stop postgresql@16
brew services start postgresql@16

echo "PostgreSQL service restarted."

# Create user with superuser privileges using postgres superuser
psql -q postgres -c "CREATE USER $DB_USERNAME WITH SUPERUSER PASSWORD '$DB_PASSWORD';" 2>/dev/null || {
   echo "Note: User might already exist, continuing..."
}

echo "User creation attempted."

# Terminate existing connections
psql -q postgres -c "
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = '$DB_NAME'
  AND pid <> pg_backend_pid();" >/dev/null 2>&1

echo "Existing connections terminated."

# Drop and recreate the database
psql -q postgres -c "DROP DATABASE IF EXISTS $DB_NAME WITH (FORCE);" >/dev/null 2>&1
createdb $DB_NAME -O $DB_USERNAME

echo "Database dropped (if existed) and recreated."

# Grant privileges
psql -q postgres -c "ALTER DATABASE $DB_NAME OWNER TO $DB_USERNAME;" >/dev/null 2>&1
psql -q $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USERNAME;" >/dev/null 2>&1

echo "Privileges granted to $DB_USERNAME."

# Create drizzle directory structure and initial journal
mkdir -p .drizzle/meta
cat > .drizzle/meta/_journal.json << 'EOF'
{
  "version": "5",
  "dialect": "pg",
  "id": "00000000-0000-0000-0000-000000000000",
  "prevId": null,
  "tables": {},
  "schemas": {},
  "migrations": []
}
EOF

echo "Drizzle directory structure created."

# Generate and push migrations
npm run makemigrations
npm run migrate

source .env && tsx scripts/seed-models.ts

echo "Script completed successfully."

sh dev.sh
