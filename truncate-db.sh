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

# Truncate all tables and reset sequences
psql -d $DB_NAME << EOF
DO \$\$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
        EXECUTE 'ALTER SEQUENCE IF EXISTS ' || quote_ident(r.tablename) || '_id_seq RESTART WITH 1';
    END LOOP;
END
\$\$;
EOF

echo "All tables truncated and sequences reset to 1."
