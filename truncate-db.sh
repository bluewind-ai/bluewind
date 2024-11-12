#!/bin/bash

# Load environment variables
set -a
. ./.env
set +a

DB_NAME=${DB_NAME:-bluewind}

# Create SQL command to truncate all tables in public schema
TRUNCATE_CMD="DO \$\$
DECLARE
    tables text;
BEGIN
    SELECT string_agg('\"' || tablename || '\"', ',')
    INTO tables
    FROM pg_tables
    WHERE schemaname = 'public';

    IF tables IS NOT NULL THEN
        EXECUTE 'TRUNCATE TABLE ' || tables || ' CASCADE';
    END IF;
END \$\$;"

# Execute the truncate command
psql -d $DB_NAME -c "$TRUNCATE_CMD"

echo "All tables truncated."
