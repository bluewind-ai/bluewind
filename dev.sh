#!/bin/bash

# Function to cleanup background processes on script exit
cleanup() {
   echo "Cleaning up..." >&2
   kill $DRIZZLE_PID 2>/dev/null
   pkill -f "Google Chrome Dev"
   exit
}

# Set up trap to call cleanup function on script exit
trap cleanup EXIT INT TERM

# Initial cleanup
lsof -ti:4983 | xargs kill -9 2>/dev/null  # Drizzle Studio
lsof -ti:5173 | xargs kill -9 2>/dev/null  # Vite

# Start Drizzle Studio in background
echo "Starting Drizzle Studio..."
npm run db:studio &
DRIZZLE_PID=$!

# Wait a moment for services to start
sleep 2

# Open Chrome to both URLs
open -a "Google Chrome Dev" https://local.drizzle.studio/
open -a "Google Chrome Dev" http://localhost:5173

# Start Remix and wait for it
npm run vite
