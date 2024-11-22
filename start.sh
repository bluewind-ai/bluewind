#!/bin/sh
# start.sh
set -a
. .env
set +a
NODE_ENV=production node ./build/server/index.js
