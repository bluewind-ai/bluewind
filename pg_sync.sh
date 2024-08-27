#!/bin/bash

# Run pg_dump on the replica

PGPASSWORD=$REPLICA_PASSWORD /opt/homebrew/opt/postgresql@16/bin/pg_dump -h $REPLICA_HOST -U $REPLICA_USER -d $REPLICA_DB >backup.sql

# Load the dump into the target database
PGPASSWORD=$TARGET_PASSWORD dropdb -h $TARGET_HOST -U $TARGET_USER $TARGET_DB
PGPASSWORD=$TARGET_PASSWORD createdb -h $TARGET_HOST -U $TARGET_USER $TARGET_DB
PGPASSWORD=$TARGET_PASSWORD psql -h $TARGET_HOST -U $TARGET_USER -d $TARGET_DB <backup.sql

# Clean up
# rm backup.sql
