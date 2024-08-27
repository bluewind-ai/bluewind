#!/bin/bash

# Run pg_dump on the replica

# PGPASSWORD=$REPLICA_PASSWORD /opt/homebrew/opt/postgresql@16/bin/pg_dump -h $REPLICA_HOST -U $REPLICA_USER -d $REPLICA_DB >backup.sql

# Load the dump into the target database
PGPASSWORD=$DB_PASSWORD dropdb -h $DB_HOST -U $DB_USERNAME $DB_NAME
PGPASSWORD=$DB_PASSWORD createdb -h $DB_HOST -U $DB_USERNAME $DB_NAME
# PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USERNAME -d $DB_NAME <backup.sql

# Clean up
# rm backup.sql
